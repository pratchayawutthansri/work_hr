const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    photoDataUrl: { type: String },
    department: { type: String, required: true, index: true },
    position: { type: String, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    employmentType: { type: String, enum: ["full_time", "part_time", "contract"], default: "full_time" },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "probation", "resigned", "suspended"], default: "active", index: true }
  },
  { timestamps: true }
);

employeeSchema.virtual("fullName").get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set("toJSON", { virtuals: true });
employeeSchema.set("toObject", { virtuals: true });

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = { Employee };
