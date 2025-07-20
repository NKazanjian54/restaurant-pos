const express = require("express");
const router = express.Router();
const db = require("../config/database"); // Supabase connection

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await db("products")
      .join("categories", "products.category_id", "categories.id")
      .select("products.*", "categories.name as category_name")
      .where("products.is_active", true)
      .orderBy("products.name");

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db("categories")
      .where("is_active", true)
      .orderBy("name");

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

module.exports = router;
