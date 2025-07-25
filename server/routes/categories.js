const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/", async (req, res) => {
  try {
    console.log("📂 Fetching categories...");

    const categories = await db("categories")
      .where("is_active", true)
      .orderBy("name")
      .select("*");

    console.log(`✅ Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });
  }
});

module.exports = router;
