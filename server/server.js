const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("🔍 Environment check:");
console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);
console.log("NODE_ENV loaded:", process.env.NODE_ENV);
console.log(
  "All env vars:",
  Object.keys(process.env).filter((key) => key.includes("DATABASE"))
);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Essential for session cookies
  })
);
app.use(express.json());
app.use(cookieParser()); // For session management

// Routes
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/auth", authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Restaurant POS API is running!",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const db = require("./config/database");
    const result = await db.raw("SELECT NOW() as current_time");
    res.json({
      message: "Database connected!",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    const db = require("./config/database");
    await db.destroy(); // Close Knex connection pool
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
  }
  process.exit(0);
});
