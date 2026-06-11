const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Load .env manually
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

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return -1;
  }
  
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Logic helper mimicking the route handler behavior
async function createLeaveRequest({ employeeId, leaveType, startDate, endDate, reason }) {
  const totalDays = calculateDays(startDate, endDate);
  if (totalDays === -1) {
    throw new Error("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น");
  }
  if (totalDays === 0) {
    throw new Error("ช่วงวันที่ลาไม่มีวันทำงาน (เป็นวันเสาร์-อาทิตย์)");
  }

  const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
  const year = new Date(startDate).getFullYear();

  // Load or auto-initialize balance
  let balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_year: { employeeId, year } }
  });

  if (!balance) {
    balance = await prisma.leaveBalance.create({
      data: {
        employeeId,
        year,
        annualAllocated: 10,
        annualUsed: 0,
        annualRemaining: 10,
        sickAllocated: 30,
        sickUsed: 0,
        sickRemaining: 30,
        personalAllocated: 3,
        personalUsed: 0,
        personalRemaining: 3
      }
    });
  }

  const allocatedKey = `${mappedType}Allocated`;
  const usedKey = `${mappedType}Used`;
  
  const allocated = balance[allocatedKey] || 0;
  const used = balance[usedKey] || 0;
  const available = allocated - used;

  if (totalDays > available) {
    throw new Error(`ยอดวันลาคงเหลือไม่เพียงพอ ขอลา: ${totalDays} วัน, คงเหลือ: ${available} วัน`);
  }

  const dbLeaveType = leaveType === "vacation" ? "annual" : leaveType;
  return await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveType: dbLeaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      days: totalDays,
      reason,
      status: "pending"
    }
  });
}

// Logic helper mimicking the approve route handler behavior
async function approveLeaveRequest(id, approverId) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id }
  });

  if (!request) {
    throw new Error("ไม่พบใบลาที่ต้องการอนุมัติ");
  }
  if (request.status !== "pending") {
    throw new Error("สามารถอนุมัติได้เฉพาะใบลาที่รออนุมัติเท่านั้น");
  }

  const { employeeId, leaveType, startDate } = request;
  const daysToDeduct = request.days || request.totalDays || 0;
  const year = new Date(startDate).getFullYear();

  if (["vacation", "sick", "personal", "annual"].includes(leaveType)) {
    const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
    const usedField = `${mappedType}Used`;
    const remainingField = `${mappedType}Remaining`;
    const allocatedField = `${mappedType}Allocated`;

    await prisma.$transaction(async (tx) => {
      let balance = await tx.leaveBalance.findUnique({
        where: { employeeId_year: { employeeId, year } }
      });

      if (!balance) {
        balance = await tx.leaveBalance.create({
          data: {
            employeeId,
            year,
            annualAllocated: 10,
            annualUsed: 0,
            annualRemaining: 10,
            sickAllocated: 30,
            sickUsed: 0,
            sickRemaining: 30,
            personalAllocated: 3,
            personalUsed: 0,
            personalRemaining: 3
          }
        });
      }

      const currentUsed = balance[usedField] || 0;
      const allocated = balance[allocatedField] || 0;
      const newUsed = currentUsed + daysToDeduct;

      if (newUsed > allocated) {
        const available = allocated - currentUsed;
        throw new Error(`ยอดวันลาคงเหลือไม่เพียงพอ ขอหักออก: ${daysToDeduct} วัน, คงเหลือ: ${available} วัน`);
      }

      await tx.leaveBalance.update({
        where: { employeeId_year: { employeeId, year } },
        data: {
          [usedField]: { increment: daysToDeduct },
          [remainingField]: { decrement: daysToDeduct }
        }
      });
    });
  }

  return await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "approved",
      approverId,
      approvedBy: approverId,
      approvedAt: new Date()
    }
  });
}

async function runTests() {
  console.log("=== Start Leave integration verification ===");
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
    console.log("⚠️ Skip running tests: DATABASE_URL contains placeholder or is undefined.");
    console.log("Please update your .env with a valid connection string to test.");
    process.exit(0);
  }

  try {
    await prisma.$connect();
    console.log("Database connected successfully.");

    // 1. Test calculateDays with weekends
    console.log("\n1. Testing calculateDays logic:");
    const testCases = [
      { start: "2026-06-11", end: "2026-06-11", expected: 1, desc: "Single weekday (Thursday)" },
      { start: "2026-06-13", end: "2026-06-14", expected: 0, desc: "Weekend only (Sat-Sun)" },
      { start: "2026-06-12", end: "2026-06-15", expected: 2, desc: "Friday to Monday (should exclude Sat-Sun)" },
      { start: "2026-06-08", end: "2026-06-14", expected: 5, desc: "Full week including weekend" }
    ];

    for (const tc of testCases) {
      const actual = calculateDays(tc.start, tc.end);
      if (actual === tc.expected) {
        console.log(`  ✅ Passed: ${tc.desc} (${tc.start} to ${tc.end}) = ${actual} days`);
      } else {
        console.error(`  ❌ Failed: ${tc.desc}. Expected ${tc.expected}, got ${actual}`);
        process.exit(1);
      }
    }

    // 2. Prepare test data in database
    console.log("\n2. Preparing database test data...");
    await prisma.leaveRequest.deleteMany({ where: { reason: "TEST_REASON_XYZ" } });
    await prisma.leaveBalance.deleteMany({ where: { year: 2026 } });
    await prisma.employee.deleteMany({ where: { email: "test-verify@hrms.local" } });

    const testEmp = await prisma.employee.create({
      data: {
        employeeCode: "EMP-TEST-999",
        firstName: "Test",
        lastName: "Verify",
        email: "test-verify@hrms.local",
        department: "IT & Engineering",
        position: "QA Automation",
        startDate: new Date("2026-01-01"),
        status: "active"
      }
    });

    const testUser = await prisma.user.upsert({
      where: { email: "admin@hrms.local" },
      update: {},
      create: {
        email: "admin@hrms.local",
        passwordHash: "dummyhash",
        role: "admin",
        permissions: [],
        status: "active"
      }
    });

    const year = 2026;
    const balance = await prisma.leaveBalance.create({
      data: {
        employeeId: testEmp.id,
        year,
        annualAllocated: 10,
        annualUsed: 8,
        annualRemaining: 2,
        sickAllocated: 10,
        sickUsed: 0,
        sickRemaining: 10,
        personalAllocated: 3,
        personalUsed: 0,
        personalRemaining: 3
      }
    });
    console.log(`  Created test employee ${testEmp.employeeCode} with 2 vacation days available.`);

    // 3. Test createLeaveRequest with insufficient balance
    console.log("\n3. Testing createLeaveRequest with insufficient balance:");
    try {
      await createLeaveRequest({
        employeeId: testEmp.id,
        leaveType: "vacation",
        startDate: "2026-06-08",
        endDate: "2026-06-12", // 5 days (only 2 left)
        reason: "TEST_REASON_XYZ"
      });
      console.error("  ❌ Failed: Allowed creation of leave request exceeding balance!");
      process.exit(1);
    } catch (err) {
      console.log(`  ✅ Passed: Correctly blocked request creation: "${err.message}"`);
    }

    // 4. Test createLeaveRequest and approveLeaveRequest with sufficient balance
    console.log("\n4. Testing createLeaveRequest and approval with sufficient balance:");
    const createdRequest = await createLeaveRequest({
      employeeId: testEmp.id,
      leaveType: "vacation",
      startDate: "2026-06-11",
      endDate: "2026-06-12", // 2 days
      reason: "TEST_REASON_XYZ"
    });

    if (createdRequest && createdRequest.totalDays === 2) {
      console.log(`  ✅ Passed: Created request successfully for ${createdRequest.totalDays} days`);
    } else {
      console.error("  ❌ Failed: Request was not created or totalDays is incorrect");
      process.exit(1);
    }

    let checkBalance = await prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId: testEmp.id, year } }
    });
    if (checkBalance.annualUsed === 8) {
      console.log(`  ✅ Passed: Balance remains at 8 used days before approval`);
    } else {
      console.error(`  ❌ Failed: Balance was decremented before approval!`);
      process.exit(1);
    }

    // 5. Test approveLeaveRequest and balance reduction
    console.log("\n5. Testing approveLeaveRequest and balance reduction:");
    const approvedResponse = await approveLeaveRequest(createdRequest.id, testUser.id);
    if (approvedResponse && approvedResponse.status === "approved") {
      console.log("  ✅ Passed: Request status updated to approved");
    } else {
      console.error("  ❌ Failed: Request status is not approved", approvedResponse);
      process.exit(1);
    }

    checkBalance = await prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId: testEmp.id, year } }
    });
    if (checkBalance.annualUsed === 10) {
      console.log(`  ✅ Passed: Balance successfully decremented (annualUsed is now 10, remaining is 0)`);
    } else {
      console.error(`  ❌ Failed: Expected annualUsed to be 10, got ${checkBalance.annualUsed}`);
      process.exit(1);
    }

    // 6. Test double approval prevention / overdraft blocking
    console.log("\n6. Testing double approval prevention / overdraft blocking:");
    const reqOverdraft = await prisma.leaveRequest.create({
      data: {
        employeeId: testEmp.id,
        leaveType: "annual",
        startDate: new Date("2026-06-15"),
        endDate: new Date("2026-06-15"),
        totalDays: 1,
        days: 1,
        reason: "TEST_REASON_XYZ",
        status: "pending"
      }
    });

    try {
      await approveLeaveRequest(reqOverdraft.id, testUser.id);
      console.error("  ❌ Failed: Allowed approval of request exceeding balance!");
      process.exit(1);
    } catch (err) {
      console.log(`  ✅ Passed: Blocked approval of overdraft request: "${err.message}"`);
    }

    // Clean up
    await prisma.leaveRequest.deleteMany({ where: { reason: "TEST_REASON_XYZ" } });
    await prisma.leaveBalance.deleteMany({ where: { year: 2026 } });
    await prisma.employee.deleteMany({ where: { email: "test-verify@hrms.local" } });

    console.log("\n🎉 All integration tests passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
