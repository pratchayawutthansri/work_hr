const { z } = require("zod");
const { Employee } = require("../models/Employee");
const { HttpError } = require("../utils/httpError");

const createEmployeeSchema = z.object({
  body: z.object({
    employeeCode: z.string().min(2),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    photoDataUrl: z.string().startsWith("data:image/").max(2500000).optional(),
    department: z.string().min(1),
    position: z.string().min(1),
    employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),
    startDate: z.coerce.date(),
    status: z.enum(["active", "probation", "resigned", "suspended"]).optional()
  })
});

const updateEmployeeSchema = createEmployeeSchema.deepPartial().extend({
  params: z.object({ id: z.string().min(1) })
});

async function listEmployees(req, res, next) {
  try {
    const { q, department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { employeeCode: new RegExp(q, "i") },
        { firstName: new RegExp(q, "i") },
        { lastName: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ];
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ data: employees });
  } catch (error) {
    next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const employee = await Employee.create(req.validated.body);
    res.status(201).json({ data: employee });
  } catch (error) {
    next(error);
  }
}

async function getEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new HttpError(404, "Employee not found");
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.validated.body, {
      new: true,
      runValidators: true
    });
    if (!employee) throw new HttpError(404, "Employee not found");
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { status: "resigned" }, { new: true });
    if (!employee) throw new HttpError(404, "Employee not found");
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployees,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee
};
