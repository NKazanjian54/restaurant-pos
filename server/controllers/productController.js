// Replace your controllers/productController.js with this:

const db = require("../config/database");

const getAllProducts = async (req, res) => {
  try {
    console.log("📦 Getting all products...");

    const products = await db("products")
      .join("categories", "products.category_id", "categories.id")
      .select("products.*", "categories.name as category_name")
      .where("products.is_active", true)
      .orderBy("categories.name", "products.name");

    // Ensure numeric fields are properly typed
    const processedProducts = products.map((product) => ({
      ...product,
      price: parseFloat(product.price) || 0,
      stock_quantity: parseInt(product.stock_quantity) || 0,
      min_stock_level: parseInt(product.min_stock_level) || 0,
    }));

    console.log(`✅ Found ${processedProducts.length} products`);
    res.json(processedProducts);
  } catch (error) {
    console.error("❌ Error getting products:", error);
    res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Getting product by ID: ${id}`);

    const product = await db("products").where("id", id).first();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Ensure numeric fields are properly typed
    const processedProduct = {
      ...product,
      price: parseFloat(product.price) || 0,
      stock_quantity: parseInt(product.stock_quantity) || 0,
      min_stock_level: parseInt(product.min_stock_level) || 0,
    };

    res.json(processedProduct);
  } catch (error) {
    console.error("❌ Error getting product by ID:", error);
    res.status(500).json({
      error: "Failed to fetch product",
      details: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, sku, stock_quantity } =
      req.body;
    console.log(`➕ Creating new product: ${name}`);

    const [createdProduct] = await db("products")
      .insert({
        name,
        description,
        price: parseFloat(price),
        category_id: parseInt(category_id),
        sku,
        stock_quantity: parseInt(stock_quantity) || 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      error: "Failed to create product",
      details: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    console.log("📂 Getting categories...");

    const categories = await db("categories")
      .where("is_active", true)
      .orderBy("name")
      .select("*");

    console.log(`✅ Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error("❌ Error getting categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  getCategories,
};
