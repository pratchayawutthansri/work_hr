import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(2).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photoDataUrl: z.string().startsWith("data:image/").max(2500000).optional(),
  department: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),
  startDate: z.coerce.date().optional(),
  status: z.enum(["active", "probation", "resigned", "suspended"]).optional()
});

function serializeEmployee(emp: any) {
  if (!emp) return null;
  return {
    ...emp,
    _id: emp.id,
    fullName: `${emp.firstName} ${emp.lastName}`
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "employee.read")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน" }, { status: 403 });
    }

    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      return NextResponse.json({ message: "ไม่พบพนักงานในระบบ" }, { status: 404 });
    }

    return NextResponse.json({ data: serializeEmployee(employee) });
  } catch (error) {
    console.error("GET employee by ID error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "employee.update")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน" }, { status: 403 });
    }

    const { id } = await params;
    const beforeEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!beforeEmployee) {
      return NextResponse.json({ message: "ไม่พบพนักงานในระบบ" }, { status: 404 });
    }

    const body = await req.json();
    const result = updateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง", errors: result.error.flatten() }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: result.data
    });

    const serializedBefore = serializeEmployee(beforeEmployee);
    const serializedAfter = serializeEmployee(updatedEmployee);

    await createAuditLog({
      actorId: user.id,
      action: "update",
      resource: "employee",
      resourceId: id,
      before: serializedBefore,
      after: serializedAfter,
      req
    });

    return NextResponse.json({ data: serializedAfter });
  } catch (error: any) {
    console.error("PATCH employee error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "ไม่พบพนักงานในระบบ" }, { status: 404 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "employee.delete")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ลบข้อมูลพนักงาน" }, { status: 403 });
    }

    const { id } = await params;
    const beforeEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!beforeEmployee) {
      return NextResponse.json({ message: "ไม่พบพนักงานในระบบ" }, { status: 404 });
    }

    // Soft delete -> Mark status as resigned
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { status: "resigned" }
    });

    const serializedBefore = serializeEmployee(beforeEmployee);
    const serializedAfter = serializeEmployee(updatedEmployee);

    await createAuditLog({
      actorId: user.id,
      action: "delete",
      resource: "employee",
      resourceId: id,
      before: serializedBefore,
      after: serializedAfter,
      req
    });

    return NextResponse.json({ data: serializedAfter });
  } catch (error: any) {
    console.error("DELETE employee error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: "ไม่พบพนักงานในระบบ" }, { status: 404 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
