import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const createEmployeeSchema = z.object({
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
});

function serializeEmployee(emp: any) {
  if (!emp) return null;
  return {
    ...emp,
    _id: emp.id,
    fullName: `${emp.firstName} ${emp.lastName}`
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "employee.read")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลพนักงาน" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const where: any = {};
    if (department) where.department = department;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ data: employees.map(serializeEmployee) });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "employee.create")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์สร้างข้อมูลพนักงาน" }, { status: 403 });
    }

    const body = await req.json();
    const result = createEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง", errors: result.error.flatten() }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: result.data
    });

    const serialized = serializeEmployee(employee);

    await createAuditLog({
      actorId: user.id,
      action: "create",
      resource: "employee",
      resourceId: employee.id,
      before: null,
      after: serialized,
      req
    });

    return NextResponse.json({ data: serialized }, { status: 201 });
  } catch (error: any) {
    console.error("POST employee error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "รหัสพนักงานหรืออีเมลนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
