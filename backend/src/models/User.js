const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "hr", "manager", "payroll", "employee", "auditor"],
      default: "employee",
      index: true
    },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    permissions: [{ type: String }],
    status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
