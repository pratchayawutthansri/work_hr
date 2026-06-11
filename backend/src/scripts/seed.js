const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { connectDatabase } = require("../config/db");
const { User } = require("../models/User");
const { Employee } = require("../models/Employee");
const { LeaveRequest } = require("../models/LeaveRequest");
const { LeaveBalance } = require("../models/LeaveBalance");

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

const sampleEmployees = [
  {
    employeeCode: "EMP-001",
    firstName: "สมชาย",
    lastName: "ใจดี",
    email: "somchai@hrms.local",
    phone: "081-111-1111",
    department: "IT & Engineering",
    position: "Senior Frontend Developer",
    startDate: new Date("2021-04-01"),
    status: "active"
  },
  {
    employeeCode: "EMP-042",
    firstName: "มานี",
    lastName: "มีตา",
    email: "manee@hrms.local",
    phone: "082-222-2222",
    department: "Sales & Marketing",
    position: "Sales Executive",
    startDate: new Date("2022-02-15"),
    status: "active"
  },
  {
    employeeCode: "EMP-088",
    firstName: "พิมพรรณ",
    lastName: "ชัยยั่ง",
    email: "pimphan@hrms.local",
    phone: "083-333-3333",
    department: "Sales & Marketing",
    position: "Account Manager",
    startDate: new Date("2020-09-10"),
    status: "active"
  },
  {
    employeeCode: "EMP-105",
    firstName: "วิชาญ",
    lastName: "เก่งกาจ",
    email: "wichan@hrms.local",
    phone: "084-444-4444",
    department: "IT & Engineering",
    position: "Backend Developer",
    startDate: new Date("2019-01-07"),
    status: "active"
  }
];

async function upsertEmployee(payload) {
  return Employee.findOneAndUpdate({ employeeCode: payload.employeeCode }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });
}

async function seed() {
  await connectDatabase();

  const employees = [];
  for (const payload of sampleEmployees) {
    employees.push(await upsertEmployee(payload));
  }

  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12);
  await User.findOneAndUpdate(
    { email: env.seedAdminEmail },
    {
      email: env.seedAdminEmail,
      passwordHash,
      role: "admin",
      permissions: adminPermissions,
      status: "active",
      employeeId: employees[0]._id
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const year = new Date().getFullYear();
  for (const employee of employees) {
    await LeaveBalance.findOneAndUpdate(
      { employeeId: employee._id, year },
      {
        employeeId: employee._id,
        year,
        vacationTotal: 12,
        sickTotal: 30,
        personalTotal: 6
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await LeaveRequest.deleteMany({});
  await LeaveRequest.create([
    {
      employeeId: employees[0]._id,
      leaveType: "vacation",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-18"),
      totalDays: 4,
      reason: "พักผ่อนกับครอบครัวที่เชียงใหม่",
      status: "pending"
    },
    {
      employeeId: employees[1]._id,
      leaveType: "sick",
      startDate: new Date("2026-10-12"),
      endDate: new Date("2026-10-12"),
      totalDays: 1,
      reason: "ไข้หวัดใหญ่ มีใบรับรองแพทย์",
      status: "pending"
    }
  ]);

  console.log("Seed completed");
  console.log(`Admin: ${env.seedAdminEmail}`);
  console.log(`Password: ${env.seedAdminPassword}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
