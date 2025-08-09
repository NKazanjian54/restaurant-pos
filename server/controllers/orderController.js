const db = require("../config/database");

// Create a new order (FIXED for PostgreSQL/Knex)
const createOrder = async (req, res) => {
  const trx = await db.transaction(); // Use Knex transactions

  try {
    const { items, customer_name, special_instructions } = req.body;

    // Validate required data
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    // Generate order number
    const orderNumber = "ORD" + Date.now();

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];

    // Get product prices and calculate totals
    for (const item of items) {
      const product = await trx("products")
        .where("id", item.product_id)
        .first();

      if (!product) {
        await trx.rollback();
        return res.status(400).json({
          error: `Product with ID ${item.product_id} not found`,
        });
      }

      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        customizations: item.customizations || null,
      });
    }

    // Calculate tax (8% as per POSInterface.js)
    const taxAmount = totalAmount * 0.08;
    const finalTotal = totalAmount + taxAmount;

    // Create order
    const [newOrder] = await trx("orders")
      .insert({
        order_number: orderNumber,
        total_amount: finalTotal,
        tax_amount: taxAmount,
        customer_name: customer_name || "Walk-in Customer",
        special_instructions: special_instructions,
        status: "completed", // Orders are immediately completed in POS
      })
      .returning("*");

    // Create order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: newOrder.id,
    }));

    await trx("order_items").insert(orderItemsWithOrderId);

    await trx.commit();

    console.log(
      `✅ Order created: ${orderNumber} for $${finalTotal.toFixed(2)}`
    );

    res.status(201).json({
      id: newOrder.id,
      order_number: orderNumber,
      total_amount: finalTotal,
      status: "completed",
      created_at: newOrder.created_at,
    });
  } catch (error) {
    await trx.rollback();
    console.error("❌ Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all orders with pagination, filtering, and search
const getAllOrders = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filter parameters
    const searchTerm = req.query.search || "";
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const minAmount = parseFloat(req.query.min_amount) || 0;
    const maxAmount = parseFloat(req.query.max_amount) || 999999;
    const status = req.query.status;

    console.log(`📊 Fetching orders - Page: ${page}, Limit: ${limit}`);

    // Build the base query
    let query = db("orders as o")
      .leftJoin("order_items as oi", "o.id", "oi.order_id")
      .leftJoin("products as p", "oi.product_id", "p.id")
      .select(
        "o.id",
        "o.order_number",
        "o.total_amount",
        "o.tax_amount",
        "o.customer_name",
        "o.status",
        "o.created_at",
        "o.completed_at",
        // PostgreSQL STRING_AGG (not SQLite GROUP_CONCAT)
        db.raw(
          `STRING_AGG(p.name || ' (x' || oi.quantity || ')', ', ') as items_summary`
        )
      )
      .groupBy(
        "o.id",
        "o.order_number",
        "o.total_amount",
        "o.tax_amount",
        "o.customer_name",
        "o.status",
        "o.created_at",
        "o.completed_at"
      );

    // Apply filters
    if (searchTerm) {
      query = query.where(function () {
        this.where("o.customer_name", "ilike", `%${searchTerm}%`).orWhere(
          "o.order_number",
          "ilike",
          `%${searchTerm}%`
        );
      });
    }

    if (startDate) {
      query = query.where("o.created_at", ">=", startDate);
    }

    if (endDate) {
      query = query.where("o.created_at", "<=", endDate + " 23:59:59");
    }

    if (minAmount > 0) {
      query = query.where("o.total_amount", ">=", minAmount);
    }

    if (maxAmount < 999999) {
      query = query.where("o.total_amount", "<=", maxAmount);
    }

    if (status) {
      query = query.where("o.status", status);
    }

    // Get total count for pagination
    const countQuery = db("orders as o").count("* as total");

    // Apply same filters to count query
    if (searchTerm) {
      countQuery.where(function () {
        this.where("o.customer_name", "ilike", `%${searchTerm}%`).orWhere(
          "o.order_number",
          "ilike",
          `%${searchTerm}%`
        );
      });
    }
    if (startDate) countQuery.where("o.created_at", ">=", startDate);
    if (endDate) countQuery.where("o.created_at", "<=", endDate + " 23:59:59");
    if (minAmount > 0) countQuery.where("o.total_amount", ">=", minAmount);
    if (maxAmount < 999999) countQuery.where("o.total_amount", "<=", maxAmount);
    if (status) countQuery.where("o.status", status);

    // Execute queries
    const [orders, totalCount] = await Promise.all([
      query.orderBy("o.created_at", "desc").limit(limit).offset(offset),
      countQuery.first(),
    ]);

    // Format the response
    const formattedOrders = orders.map((order) => ({
      ...order,
      total_amount: parseFloat(order.total_amount) || 0,
      tax_amount: parseFloat(order.tax_amount) || 0,
      items_summary: order.items_summary || "No items",
    }));

    const totalPages = Math.ceil(totalCount.total / limit);

    console.log(`✅ Found ${orders.length} orders (${totalCount.total} total)`);

    res.json({
      orders: formattedOrders,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_orders: parseInt(totalCount.total),
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      filters: {
        search: searchTerm,
        start_date: startDate,
        end_date: endDate,
        min_amount: minAmount,
        max_amount: maxAmount === 999999 ? null : maxAmount,
        status: status,
      },
    });
  } catch (error) {
    console.error("❌ Error getting orders:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID with full details
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Fetching order details for ID: ${id}`);

    // Get order details
    const order = await db("orders").where("id", id).first();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with product details
    const items = await db("order_items as oi")
      .join("products as p", "oi.product_id", "p.id")
      .leftJoin("categories as c", "p.category_id", "c.id")
      .select(
        "oi.*",
        "p.name as product_name",
        "p.description as product_description",
        "c.name as category_name"
      )
      .where("oi.order_id", id)
      .orderBy("oi.id");

    // Format the items
    const formattedItems = items.map((item) => ({
      ...item,
      unit_price: parseFloat(item.unit_price) || 0,
      total_price: parseFloat(item.total_price) || 0,
    }));

    // Format the order
    const formattedOrder = {
      ...order,
      total_amount: parseFloat(order.total_amount) || 0,
      tax_amount: parseFloat(order.tax_amount) || 0,
      items: formattedItems,
    };

    console.log(
      `✅ Order details loaded: ${order.order_number} with ${items.length} items`
    );

    res.json(formattedOrder);
  } catch (error) {
    console.error("❌ Error getting order by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "completed", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    console.log(`🔄 Updating order ${id} status to: ${status}`);

    // Update order
    const updateData = { status };
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const result = await db("orders")
      .where("id", id)
      .update(updateData)
      .returning("*");

    if (result.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`✅ Order ${id} status updated to: ${status}`);

    res.json(result[0]);
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get order statistics (bonus feature)
const getOrderStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const stats = await db("orders")
      .select(
        db.raw("COUNT(*) as total_orders"),
        db.raw("SUM(total_amount) as total_revenue"),
        db.raw("AVG(total_amount) as average_order"),
        db.raw(
          `COUNT(CASE WHEN DATE(created_at) = '${today}' THEN 1 END) as today_orders`
        ),
        db.raw(
          `SUM(CASE WHEN DATE(created_at) = '${today}' THEN total_amount ELSE 0 END) as today_revenue`
        )
      )
      .first();

    const formattedStats = {
      total_orders: parseInt(stats.total_orders) || 0,
      total_revenue: parseFloat(stats.total_revenue) || 0,
      average_order: parseFloat(stats.average_order) || 0,
      today_orders: parseInt(stats.today_orders) || 0,
      today_revenue: parseFloat(stats.today_revenue) || 0,
    };

    res.json(formattedStats);
  } catch (error) {
    console.error("❌ Error getting order stats:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats, // New endpoint for dashboard stats
};
