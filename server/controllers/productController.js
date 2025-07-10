const db = require('../config/database');

const getAllProducts = async (req, res) => {
  try {
    const products = await db.all(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
      ORDER BY c.name, p.name
    `);
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, sku, stock_quantity } = req.body;
    
    const result = await db.run(
      'INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, category_id, sku, stock_quantity || 0]
    );
    
    // Get the created product
    const createdProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);
    
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories WHERE is_active = 1 ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  getCategories
};