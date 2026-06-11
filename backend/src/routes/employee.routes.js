const express = require("express");
const { requireAuth, requirePermission } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { audit } = require("../middlewares/audit");
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employee.controller");

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("employee.read"), listEmployees);
router.post("/", requirePermission("employee.create"), validate(createEmployeeSchema), audit("create", "employee"), createEmployee);
router.get("/:id", requirePermission("employee.read"), getEmployee);
router.patch("/:id", requirePermission("employee.update"), validate(updateEmployeeSchema), audit("update", "employee"), updateEmployee);
router.delete("/:id", requirePermission("employee.delete"), audit("delete", "employee"), deleteEmployee);

module.exports = router;
