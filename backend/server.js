require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

// Import middleware
const corsConfig = require("./src/middleware/cors");
const errorHandler = require("./src/middleware/errorHandler");

// Import routes
const chatRoutes = require("./src/routes/chat");
const documentRoutes = require("./src/routes/documents");

// Import config
const { initializeDatabase } = require("./src/config/database");
const logger = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 8000;

// Create necessary directories
const directories = ["./data", "./uploads"];
directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize database
initializeDatabase();

// Initialize vector store after database
const vectorStore = require("./src/services/vectorStore");
vectorStore.initialize().catch((error) => {
  logger.error("Failed to initialize vector store:", error);
});

// CORS - must be before other middleware
app.use(corsConfig);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Pal - AI-Powered FAQ Chatbot API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  });
});

// API routes
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/documents", documentRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Pal Backend Server is running on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📖 API Documentation: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

module.exports = app;
