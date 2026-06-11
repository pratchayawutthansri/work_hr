const { z } = require("zod");
const { LeaveRequest } = require("../models/LeaveRequest");
const { LeaveBalance } = require("../models/LeaveBalance");
const { Employee } = require("../models/Employee");
const { HttpError } = require("../utils/httpError");

const createLeaveRequestSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    leaveType: z.enum(["vacation", "sick", "personal", "maternity", "emergency"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().min(3),
    attachmentUrl: z.string().url().optional()
  })
});

const actionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ rejectedReason: z.string().optional() }).optional()
});

function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new HttpError(400, "End date must be on or after start date");
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

async function listLeaveRequests(req, res, next) {
  try {
    const { status, employeeId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    const requests = await LeaveRequest.find(filter)
      .populate("employeeId", "employeeCode firstName lastName department position")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ data: requests });
  } catch (error) {
    next(error);
  }
}

async function createLeaveRequest(req, res, next) {
  try {
    const { employeeId, leaveType, startDate, endDate } = req.validated.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new HttpError(404, "Employee not found");

    const totalDays = calculateDays(startDate, endDate);
    if (totalDays === 0) {
      throw new HttpError(400, "Leave period contains no working days (weekends only)");
    }

    if (["vacation", "sick", "personal", "annual"].includes(leaveType)) {
      const year = new Date(startDate).getFullYear();
      let balance = await LeaveBalance.findOne({ employeeId, year });
      if (!balance) {
        // Automatically initialize LeaveBalance for this employee and year on-the-fly!
        balance = await LeaveBalance.create({
          employeeId,
          year,
          annual: { allocated: 10, used: 0, remaining: 10 },
          sick: { allocated: 30, used: 0, remaining: 30 },
          personal: { allocated: 3, used: 0, remaining: 3 }
        });
        console.log(`Initialized new LeaveBalance for employee ${employeeId} for year ${year}`);
      }

      const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
      const allocated = balance[mappedType].allocated;
      const used = balance[mappedType].used;
      const available = allocated - used;

      if (totalDays > available) {
        throw new HttpError(400, `Insufficient leave balance. Requested: ${totalDays} days, Available: ${available} days`);
      }
    }

    // Map vacation leaveType to annual for MongoDB consistency
    const dbLeaveType = leaveType === "vacation" ? "annual" : leaveType;
    const request = await LeaveRequest.create({
      ...req.validated.body,
      leaveType: dbLeaveType,
      totalDays,
      days: totalDays
    });
    res.status(201).json({ data: await request.populate("employeeId", "employeeCode firstName lastName department position") });
  } catch (error) {
    next(error);
  }
}

async function approveLeaveRequest(req, res, next) {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) throw new HttpError(404, "Leave request not found");
    if (request.status !== "pending") throw new HttpError(409, "Only pending requests can be approved");

    const { employeeId, leaveType, startDate } = request;
    const daysToDeduct = request.days || request.totalDays || 0;
    const year = new Date(startDate).getFullYear();

    if (["vacation", "sick", "personal", "annual"].includes(leaveType)) {
      const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
      const allocatedField = `${mappedType}.allocated`;
      const usedField = `${mappedType}.used`;
      const remainingField = `${mappedType}.remaining`;

      const updateQuery = {
        employeeId,
        year,
        $expr: {
          $lte: [
            { $add: [ `$${usedField}`, daysToDeduct ] },
            `$${allocatedField}`
          ]
        }
      };

      const updateDoc = {
        $inc: {
          [usedField]: daysToDeduct,
          [remainingField]: -daysToDeduct
        }
      };

      const updatedBalance = await LeaveBalance.findOneAndUpdate(updateQuery, updateDoc, { new: true });
      if (!updatedBalance) {
        let balanceExists = await LeaveBalance.findOne({ employeeId, year });
        if (!balanceExists) {
          balanceExists = await LeaveBalance.create({
            employeeId,
            year,
            annual: { allocated: 10, used: 0, remaining: 10 },
            sick: { allocated: 30, used: 0, remaining: 30 },
            personal: { allocated: 3, used: 0, remaining: 3 }
          });
        }
        
        const available = balanceExists[mappedType].allocated - balanceExists[mappedType].used;
        throw new HttpError(400, `Cannot approve leave request. Insufficient balance. Requested: ${daysToDeduct} days, Available: ${available} days`);
      }
    }

    request.status = "approved";
    request.approverId = req.user._id;
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();
    res.json({ data: await request.populate("employeeId", "employeeCode firstName lastName department position") });
  } catch (error) {
    next(error);
  }
}

async function rejectLeaveRequest(req, res, next) {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) throw new HttpError(404, "Leave request not found");
    if (request.status !== "pending") throw new HttpError(409, "Only pending requests can be rejected");

    request.status = "rejected";
    request.approverId = req.user._id;
    request.approvedBy = req.user._id;
    request.rejectedReason = req.body?.rejectedReason || "Rejected by approver";
    await request.save();
    res.json({ data: await request.populate("employeeId", "employeeCode firstName lastName department position") });
  } catch (error) {
    next(error);
  }
}

async function getLeaveBalance(req, res, next) {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const balance = await LeaveBalance.findOne({ employeeId: req.params.employeeId, year });
    if (!balance) throw new HttpError(404, "Leave balance not found");
    res.json({ data: balance });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calculateDays,
  createLeaveRequestSchema,
  actionSchema,
  listLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveBalance
};
