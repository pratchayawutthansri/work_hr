const express = require("express");
const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { loginSchema, login, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);

module.exports = router;
