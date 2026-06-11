const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load .env manually if running outside nextjs environment
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const prisma = new PrismaClient();

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

async function seed() {
  console.log("Connecting to Database using URL:", process.env.DATABASE_URL ? "URL Defined" : "Undefined");
  
  console.log("Cleaning database...");
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log("Seeding employees...");
  const employees = [];
  for (const emp of sampleEmployees) {
    const created = await prisma.employee.create({ data: emp });
    employees.push(created);
  }

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@hrms.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Password123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "admin",
      permissions: adminPermissions,
      status: "active",
      employeeId: employees[0].id
    }
  });

  console.log("Seeding leave balances...");
  const year = new Date().getFullYear();
  for (const employee of employees) {
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        year,
        annualAllocated: 12,
        annualUsed: 0,
        annualRemaining: 12,
        sickAllocated: 30,
        sickUsed: 0,
        sickRemaining: 30,
        personalAllocated: 6,
        personalUsed: 0,
        personalRemaining: 6
      }
    });
  }

  console.log("Seeding leave requests...");
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: employees[0].id,
        leaveType: "annual",
        startDate: new Date("2026-10-15"),
        endDate: new Date("2026-10-18"),
        totalDays: 4,
        days: 4,
        reason: "พักผ่อนกับครอบครัวที่เชียงใหม่",
        status: "pending"
      },
      {
        employeeId: employees[1].id,
        leaveType: "sick",
        startDate: new Date("2026-10-12"),
        endDate: new Date("2026-10-12"),
        totalDays: 1,
        days: 1,
        reason: "ไข้หวัดใหญ่ มีใบรับรองแพทย์",
        status: "pending"
      }
    ]
  });

  console.log("Seed completed successfully");
  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Admin Password: ${adminPassword}`);
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error("Seeding failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
