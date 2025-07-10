const db = require('../config/database');

const createOrder = async (req, res) => {
  try {
    const { items, customer_name, special_instructions } = req.body;
    
    // Generate order number
    const orderNumber = 'ORD' + Date.now();
    
    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];
    
    // Get product prices and calculate totals
    for (const item of items) {
      const product = await db.get('SELECT price FROM products WHERE id = ?', [item.product_id]);
      if (!product) {
        return res.status(400).json({ error: `Product with ID ${item.product_id} not found` });
      }
      
      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;
      
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        customizations: item.customizations || null
      });
    }
    
    // Use serialize to ensure transaction-like behavior
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          // Create order
          const orderResult = await db.run(
            'INSERT INTO orders (order_number, total_amount, customer_name, special_instructions) VALUES (?, ?, ?, ?)',
            [orderNumber, totalAmount, customer_name, special_instructions]
          );
          
          const orderId = orderResult.id;
          
          // Create order items
          for (const item of orderItems) {
            await db.run(
              'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, customizations) VALUES (?, ?, ?, ?, ?, ?)',
              [orderId, item.product_id, item.quantity, item.unit_price, item.total_price, item.customizations]
            );
          }
          
          // Get the complete order with items
          const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
          resolve(res.status(201).json(createdOrder));
          
        } catch (error) {
          reject(res.status(500).json({ error: error.message }));
        }
      });
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await db.all(`
      SELECT o.*,
             GROUP_CONCAT(
               p.name || ' (x' || oi.quantity || ')', 
               ', '
             ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const items = await db.all(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    order.items = items;
    res.json(order);
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.run(
      'UPDATE orders SET status = ?, completed_at = CASE WHEN ? = "completed" THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id = ?',
      [status, status, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus
};