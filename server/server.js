const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database with inline schema
const initializeDatabase = async () => {
  const db = require("./config/database");

  try {
    // Check if tables exist
    const tables = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
    );

    if (!tables) {
      console.log("Initializing database tables...");

      // Create tables directly (no file dependency)
      await db.run(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.run(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category_id INTEGER,
          sku TEXT UNIQUE,
          stock_quantity INTEGER DEFAULT 0,
          min_stock_level INTEGER DEFAULT 10,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `);

      await db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'cashier',
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.run(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          user_id INTEGER,
          total_amount REAL NOT NULL,
          tax_amount REAL DEFAULT 0,
          discount_amount REAL DEFAULT 0,
          status TEXT DEFAULT 'new',
          payment_method TEXT,
          customer_name TEXT,
          special_instructions TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await db.run(`
        CREATE TABLE order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          customizations TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);

      console.log("Database tables created successfully");

      // Insert sample data
      console.log("Inserting sample data...");

      // Categories
      await db.run(
        "INSERT INTO categories (name, description) VALUES ('Burgers', 'All types of burgers')"
      );
      await db.run(
        "INSERT INTO categories (name, description) VALUES ('Sides', 'Side dishes and appetizers')"
      );
      await db.run(
        "INSERT INTO categories (name, description) VALUES ('Beverages', 'Soft drinks and beverages')"
      );
      await db.run(
        "INSERT INTO categories (name, description) VALUES ('Desserts', 'Sweet treats and desserts')"
      );

      // Products
      await db.run(
        "INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES ('Classic Burger', 'Beef patty with lettuce, tomato, onion', 8.99, 1, 'BUR001', 50)"
      );
      await db.run(
        "INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES ('Cheeseburger', 'Classic burger with cheese', 9.99, 1, 'BUR002', 45)"
      );
      await db.run(
        "INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES ('French Fries', 'Golden crispy fries', 3.99, 2, 'SID001', 100)"
      );
      await db.run(
        "INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES ('Coca-Cola', 'Classic Coke', 2.49, 3, 'BEV001', 200)"
      );

      // Sample user
      await db.run(
        "INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES ('admin', 'admin@restaurant.com', 'admin123', 'admin', 'Admin', 'User')"
      );

      console.log("Sample data inserted successfully");
    } else {
      console.log("Database already initialized");
    }
  } catch (error) {
    console.error("Error initializing database:", error.message);
  }
};

// Routes
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "POS System API is running!" });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const db = require("./config/database");
    const result = await db.get("SELECT datetime('now') as current_time");
    res.json({ message: "Database connected!", time: result.current_time });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize database on startup
initializeDatabase().then(() => {
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  const db = require("./config/database");
  await db.close();
  process.exit(0);
});
