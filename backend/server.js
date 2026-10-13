
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const integrationRoutes = require("./src/routes/integrationRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const orderRoutes = require("./src/routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5175";
app.use(cors({
  origin: [allowedOrigin, "http://localhost:5173", "http://localhost:5175"],
  credentials: true,
}));

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "CustomerHub CRM API is running",
    status: "success",
  });
});

// Health check endpoint (retained)
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "CustomerHub CRM Backend",
    timestamp: new Date().toISOString(),
  });
});

// WooCommerce Integration & CRM endpoints
app.use("/api/integration", integrationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(err.statusCode || err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CustomerHub API running at http://localhost:${PORT}`);
  });
}

module.exports = app;

