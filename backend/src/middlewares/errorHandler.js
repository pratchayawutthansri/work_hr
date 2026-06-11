const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: error.flatten()
    });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({ message: "Invalid resource id" });
    return;
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details,
    requestId: req.id
  });
}

module.exports = { notFound, errorHandler };
