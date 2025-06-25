const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  };

  // Specific error types
  if (err.name === "ValidationError") {
    error.status = 400;
    error.message = "Validation Error";
    error.details = Object.values(err.errors).map((e) => e.message);
  }

  if (err.name === "CastError") {
    error.status = 400;
    error.message = "Invalid ID format";
  }

  if (err.code === 11000) {
    error.status = 400;
    error.message = "Duplicate field value";
  }

  if (err.name === "JsonWebTokenError") {
    error.status = 401;
    error.message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    error.status = 401;
    error.message = "Token expired";
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    error.status = 400;
    error.message = "File too large";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error.status = 400;
    error.message = "Unexpected file field";
  }

  // Database errors
  if (err.code === "SQLITE_CONSTRAINT") {
    error.status = 400;
    error.message = "Database constraint violation";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && error.status === 500) {
    error.message = "Something went wrong";
    delete error.stack;
  } else if (process.env.NODE_ENV !== "production") {
    error.stack = err.stack;
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(error.stack && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
