const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { connectDatabase } = require("../config/db");
const { User } = require("../models/User");
const { Employee } = require("../models/Employee");

const adminPermissions = [
  "employee.read",
  "employee.create",
  "employee.update",
  "employee.delete",
  "leave.read",
  "leave.request.create",
  "leave.approve",
  "payroll.read",
  "payroll.process",
  "performance.read",
  "performance.review"
];

async function run() {
  console.log("=== DB Migration: Fixing User Schemas in worhr ===");
  await connectDatabase();

  // 1. Find the admin employee
  let adminEmp = await Employee.findOne({ employeeCode: "EMP000" });
  if (!adminEmp) {
    adminEmp = await Employee.findOne(); // Fallback to any employee if EMP000 is not found
  }
  const employeeId = adminEmp ? adminEmp._id : null;
  console.log(`Linking default admin to Employee ID: ${employeeId} (${adminEmp ? adminEmp.firstName : "None"})`);

  // 2. Create/Update admin@hrms.local
  const passwordHash = await bcrypt.hash("Password123!", 12);
  await User.findOneAndUpdate(
    { email: "admin@hrms.local" },
    {
      email: "admin@hrms.local",
      passwordHash,
      role: "admin",
      permissions: adminPermissions,
      status: "active",
      employeeId
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log("Successfully created/updated admin@hrms.local with Password123!");

  // 3. Fix existing admin@worhr.com if it exists
  const existingAdmin = await User.findOne({ email: "admin@worhr.com" });
  if (existingAdmin) {
    await User.updateOne(
      { email: "admin@worhr.com" },
      {
        $set: {
          role: "admin",
          status: "active",
          permissions: adminPermissions
        }
      }
    );
    console.log("Successfully updated admin@worhr.com fields (role set to admin, status set to active)");
  }

  // 4. Update status field for any user with isActive field
  const rawUsers = await mongoose.connection.db.collection("users").find({}).toArray();
  for (const rawUser of rawUsers) {
    if (rawUser.isActive !== undefined && !rawUser.status) {
      const status = rawUser.isActive ? "active" : "disabled";
      await User.updateOne({ _id: rawUser._id }, { $set: { status } });
      console.log(`Updated status for user ${rawUser.email} to ${status} based on isActive`);
    }
  }

  console.log("=== Migration completed successfully ===");
  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
