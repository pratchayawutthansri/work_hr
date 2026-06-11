const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models/User");
const { HttpError } = require("../utils/httpError");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new HttpError(401, "Authentication required");

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || user.status !== "active") throw new HttpError(401, "Invalid session");

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new HttpError(401, "Invalid or expired token"));
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    if (req.user?.role === "admin" || permissions.includes(permission)) {
      next();
      return;
    }
    next(new HttpError(403, `Missing permission: ${permission}`));
  };
}

module.exports = { requireAuth, requirePermission };
