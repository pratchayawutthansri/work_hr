const express = require("express");
const { requireAuth, requirePermission } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { audit } = require("../middlewares/audit");
const {
  createLeaveRequestSchema,
  actionSchema,
  listLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveBalance
} = require("../controllers/leave.controller");

const router = express.Router();

router.use(requireAuth);

router.get("/requests", requirePermission("leave.read"), listLeaveRequests);
router.post("/requests", requirePermission("leave.request.create"), validate(createLeaveRequestSchema), audit("create", "leave_request"), createLeaveRequest);
router.post("/requests/:id/approve", requirePermission("leave.approve"), validate(actionSchema), audit("approve", "leave_request"), approveLeaveRequest);
router.post("/requests/:id/reject", requirePermission("leave.approve"), validate(actionSchema), audit("reject", "leave_request"), rejectLeaveRequest);
router.get("/balances/:employeeId", requirePermission("leave.read"), getLeaveBalance);

module.exports = router;
