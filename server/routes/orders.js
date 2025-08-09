const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
} = require("../controllers/orderController");

// Create new order
router.post("/", createOrder);

// Get all orders with pagination and filtering
// Query params: page, limit, search, start_date, end_date, min_amount, max_amount, status
// Example: /api/orders?page=1&limit=10&search=john&start_date=2025-01-01
router.get("/", getAllOrders);

// Get order statistics (for dashboard/analytics)
router.get("/stats", getOrderStats);

// Get specific order by ID with full details
router.get("/:id", getOrderById);

// Update order status
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
