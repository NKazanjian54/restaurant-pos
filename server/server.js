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
console.log("FRONTEND_URL loaded:", process.env.FRONTEND_URL);

// COMPREHENSIVE CORS CONFIGURATION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "https://restaurant-pos-orcin.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove any undefined values

    console.log("🌐 CORS Request from origin:", origin);
    console.log("✅ Allowed origins:", allowedOrigins);

    if (allowedOrigins.includes(origin)) {
      console.log("✅ Origin allowed");
      return callback(null, true);
    } else {
      console.log("❌ Origin not allowed");
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "Set-Cookie",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Other middleware
app.use(express.json());
app.use(cookieParser());

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.get("Origin") || "none"}`
  );
  next();
});

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
    allowedOrigins: [
      "http://localhost:3000",
      "https://restaurant-pos-orcin.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
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
  console.log(`🌐 Allowed CORS origins:`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - https://restaurant-pos-orcin.vercel.app`);
  console.log(`   - ${process.env.FRONTEND_URL || "not set"}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    const db = require("./config/database");
    await db.destroy();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error.message);
  }
  process.exit(0);
});
