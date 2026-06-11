const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const env = require("../config/env");
const { User } = require("../models/User");
const { HttpError } = require("../utils/httpError");

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

function serializeUser(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    permissions: user.permissions,
    status: user.status
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || user.status !== "active") throw new HttpError(401, "Invalid email or password");

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw new HttpError(401, "Invalid email or password");

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: signToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: serializeUser(req.user) });
}

module.exports = { loginSchema, login, me };
