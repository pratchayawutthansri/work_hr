const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    leaveType: {
      type: String,
      enum: ["vacation", "sick", "personal", "maternity", "emergency", "annual"],
      required: true,
      index: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    days: { type: Number, min: 0.5 }, // Compatible with existing DB documents
    reason: { type: String, required: true, trim: true },
    attachmentUrl: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Compatible with existing DB documents
    approvedAt: Date,
    rejectedReason: String
  },
  { timestamps: true }
);

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

module.exports = { LeaveRequest };
