const { AuditLog } = require("../models/AuditLog");
const { Employee } = require("../models/Employee");
const { LeaveRequest } = require("../models/LeaveRequest");

const models = {
  employee: Employee,
  leave_request: LeaveRequest
};

function audit(action, resource) {
  return async (req, res, next) => {
    let before = null;

    if (["update", "delete", "approve", "reject"].includes(action) && req.params.id) {
      try {
        const Model = models[resource];
        if (Model) {
          const doc = await Model.findById(req.params.id);
          if (doc) {
            before = doc.toObject();
          }
        }
      } catch (err) {
        console.error("Failed to fetch before state for audit log:", err);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        AuditLog.create({
          actorId: req.user?._id,
          action,
          resource,
          resourceId: body?.data?._id || req.params.id,
          before,
          after: body?.data,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        }).catch((err) => {
          console.error("Audit log creation error:", err);
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { audit };
