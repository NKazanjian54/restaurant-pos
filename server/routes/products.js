const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/", async (req, res) => {
  try {
    console.log("📦 Fetching products...");

    const products = await db("products")
      .join("categories", "products.category_id", "categories.id")
      .select("products.*", "categories.name as category_name")
      .where("products.is_active", true)
      .orderBy("products.name");

    const processedProducts = products.map((product) => ({
      ...product,
      price: parseFloat(product.price) || 0,
      stock_quantity: parseInt(product.stock_quantity) || 0,
    }));

    console.log(`✅ Found ${processedProducts.length} products`);
    res.json(processedProducts);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({
      error: "Failed to fetch products",
      details: error.message,
    });
  }
});

module.exports = router;
