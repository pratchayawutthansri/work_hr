const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/db");
const { Employee } = require("../models/Employee");
const { LeaveRequest } = require("../models/LeaveRequest");
const { LeaveBalance } = require("../models/LeaveBalance");
const { User } = require("../models/User");
const { calculateDays, createLeaveRequest, approveLeaveRequest } = require("../controllers/leave.controller");
const { HttpError } = require("../utils/httpError");

async function runTests() {
  console.log("=== Start Leave integration verification ===");
  await connectDatabase();
  console.log("Database connected.");

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
      console.log(`✅ Passed: ${tc.desc} (${tc.start} to ${tc.end}) = ${actual} days`);
    } else {
      console.error(`❌ Failed: ${tc.desc}. Expected ${tc.expected}, got ${actual}`);
      process.exit(1);
    }
  }

  // 2. Prepare test data in database
  console.log("\n2. Preparing database test data...");
  
  // Clean up existing test data
  await Employee.deleteMany({ email: "test-verify@hrms.local" });
  await LeaveBalance.deleteMany({ year: 2026 });
  await LeaveRequest.deleteMany({ reason: "TEST_REASON_XYZ" });

  const testEmp = await Employee.create({
    employeeCode: "EMP-TEST-999",
    firstName: "Test",
    lastName: "Verify",
    email: "test-verify@hrms.local",
    department: "IT & Engineering",
    position: "QA Automation",
    startDate: new Date("2026-01-01"),
    status: "active"
  });

  const testUser = await User.findOneAndUpdate(
    { email: "admin@hrms.local" },
    { email: "admin@hrms.local" },
    { upsert: true, new: true }
  );

  const year = 2026;
  const balance = await LeaveBalance.create({
    employeeId: testEmp._id,
    year,
    annual: { allocated: 10, used: 8, remaining: 2 }, // 2 days available
    sick: { allocated: 10, used: 0, remaining: 10 },
    personal: { allocated: 3, used: 0, remaining: 3 }
  });

  console.log(`Created test employee ${testEmp.employeeCode} with 2 vacation days available.`);

  // 3. Test createLeaveRequest with insufficient balance
  console.log("\n3. Testing createLeaveRequest with insufficient balance:");
  
  const reqFail = {
    validated: {
      body: {
        employeeId: testEmp._id.toString(),
        leaveType: "vacation",
        startDate: "2026-06-08", // Monday
        endDate: "2026-06-12", // Friday = 5 days (need 5, only 2 left)
        reason: "TEST_REASON_XYZ"
      }
    }
  };

  let nextError = null;
  await createLeaveRequest(reqFail, {}, (err) => {
    nextError = err;
  });

  if (nextError) {
    console.log(`✅ Passed: Correctly blocked request creation via next(): "${nextError.message}"`);
    if (!(nextError instanceof HttpError) || nextError.statusCode !== 400) {
      console.error("❌ Failed: Error is not a 400 HttpError", nextError);
      process.exit(1);
    }
  } else {
    console.error("❌ Failed: Allowed creation of leave request exceeding balance!");
    process.exit(1);
  }

  // 4. Test createLeaveRequest and approveLeaveRequest with sufficient balance
  console.log("\n4. Testing createLeaveRequest and approval with sufficient balance:");
  
  const reqSuccess = {
    validated: {
      body: {
        employeeId: testEmp._id.toString(),
        leaveType: "vacation",
        startDate: "2026-06-11", // Thursday
        endDate: "2026-06-12", // Friday = 2 days (exactly matching available)
        reason: "TEST_REASON_XYZ"
      }
    }
  };

  let createdRequest;
  const mockResCreate = {
    status: (code) => {
      if (code !== 201) console.error("❌ Failed: status code is not 201");
      return mockResCreate;
    },
    json: (data) => {
      createdRequest = data.data;
    }
  };

  await createLeaveRequest(reqSuccess, mockResCreate, (err) => {
    if (err) {
      console.error("❌ Failed: createLeaveRequest threw error", err);
      process.exit(1);
    }
  });

  if (createdRequest && createdRequest.totalDays === 2) {
    console.log(`✅ Passed: Created request successfully for ${createdRequest.totalDays} days`);
  } else {
    console.error("❌ Failed: Request was not created or totalDays is incorrect");
    process.exit(1);
  }

  // Verify that balance is not decremented yet (since status is pending)
  let checkBalance = await LeaveBalance.findOne({ employeeId: testEmp._id, year });
  if (checkBalance.annual.used === 8) {
    console.log(`✅ Passed: Balance remains at 8 used days before approval`);
  } else {
    console.error("❌ Failed: Balance was decremented before approval!");
    process.exit(1);
  }

  // Approve request
  console.log("\n5. Testing approveLeaveRequest and balance reduction:");
  
  const reqApprove = {
    params: { id: createdRequest._id.toString() },
    user: { _id: testUser._id }
  };

  let approvedResponse;
  const mockResApprove = {
    json: (data) => {
      approvedResponse = data.data;
    }
  };

  await approveLeaveRequest(reqApprove, mockResApprove, (err) => {
    if (err) {
      console.error("❌ Failed: approveLeaveRequest threw error", err);
      process.exit(1);
    }
  });

  if (approvedResponse && approvedResponse.status === "approved") {
    console.log("✅ Passed: Request status updated to approved");
  } else {
    console.error("❌ Failed: Request status is not approved", approvedResponse);
    process.exit(1);
  }

  // Check updated balance
  checkBalance = await LeaveBalance.findOne({ employeeId: testEmp._id, year });
  if (checkBalance.annual.used === 10) {
    console.log(`✅ Passed: Balance successfully decremented (annual.used is now 10, remaining is 0)`);
  } else {
    console.error(`❌ Failed: Expected annual.used to be 10, got ${checkBalance.annual.used}`);
    process.exit(1);
  }

  // Try to approve a second time or exceed balance
  console.log("\n6. Testing double approval prevention / overdraft blocking:");
  const reqOverdraft = await LeaveRequest.create({
    employeeId: testEmp._id,
    leaveType: "vacation",
    startDate: new Date("2026-06-15"),
    endDate: new Date("2026-06-15"), // 1 day
    totalDays: 1,
    reason: "TEST_REASON_XYZ",
    status: "pending"
  });

  const reqApproveOverdraft = {
    params: { id: reqOverdraft._id.toString() },
    user: { _id: testUser._id }
  };

  nextError = null;
  await approveLeaveRequest(reqApproveOverdraft, {}, (err) => {
    nextError = err;
  });

  if (nextError) {
    console.log(`✅ Passed: Blocked approval of overdraft request via next(): "${nextError.message}"`);
    if (!(nextError instanceof HttpError) || nextError.statusCode !== 400) {
      console.error("❌ Failed: Error is not a 400 HttpError", nextError);
      process.exit(1);
    }
  } else {
    console.error("❌ Failed: Allowed approval of request exceeding balance!");
    process.exit(1);
  }

  // 7. Test Auto-init for new year
  console.log("\n7. Testing LeaveBalance auto-initialization for on-the-fly years:");
  // Let's delete the balance record for 2026 we just created
  await LeaveBalance.deleteMany({ employeeId: testEmp._id, year: 2026 });
  
  // Submit request for year 2026 (no balance exists for this year yet)
  const reqAutoInit = {
    validated: {
      body: {
        employeeId: testEmp._id.toString(),
        leaveType: "personal",
        startDate: "2026-06-22", // Monday
        endDate: "2026-06-23", // Tuesday = 2 days (initial personal is 3)
        reason: "TEST_REASON_XYZ"
      }
    }
  };

  let autoInitRequest;
  await createLeaveRequest(reqAutoInit, mockResCreate, (err) => {
    if (err) console.error("❌ Failed: auto-init create threw error", err);
  });

  // Verify that balance document was automatically created in DB
  const autoInitBalance = await LeaveBalance.findOne({ employeeId: testEmp._id, year: 2026 });
  if (autoInitBalance && autoInitBalance.personal.allocated === 3 && autoInitBalance.personal.used === 0) {
    console.log("✅ Passed: Automatically created LeaveBalance record with default 3 personal days!");
  } else {
    console.error("❌ Failed: Did not automatically create LeaveBalance or default values are wrong", autoInitBalance);
    process.exit(1);
  }

  // Clean up
  await Employee.deleteMany({ email: "test-verify@hrms.local" });
  await LeaveBalance.deleteMany({ year: 2026 });
  await LeaveRequest.deleteMany({ reason: "TEST_REASON_XYZ" });

  console.log("\n🎉 All tests passed successfully!");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});
