const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    year: { type: Number, required: true, index: true },
    annual: {
      allocated: { type: Number, default: 10 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 10 }
    },
    sick: {
      allocated: { type: Number, default: 30 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 30 }
    },
    personal: {
      allocated: { type: Number, default: 3 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 3 }
    }
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = { LeaveBalance };
