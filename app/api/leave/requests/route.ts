import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

const createLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(["vacation", "sick", "personal", "maternity", "emergency", "annual"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3),
  attachmentUrl: z.string().url().optional().or(z.literal(""))
});

function calculateDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
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

function serializeLeaveRequest(req: any) {
  if (!req) return null;
  const emp = req.employee || {};
  return {
    _id: req.id,
    id: req.id,
    employeeId: {
      _id: req.employeeId,
      id: req.employeeId,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: emp.firstName ? `${emp.firstName} ${emp.lastName}` : undefined,
      department: emp.department,
      position: emp.position
    },
    leaveType: req.leaveType,
    startDate: req.startDate,
    endDate: req.endDate,
    totalDays: req.totalDays,
    days: req.days,
    reason: req.reason,
    attachmentUrl: req.attachmentUrl,
    status: req.status,
    approvedBy: req.approvedBy,
    approverId: req.approverId,
    approvedAt: req.approvedAt,
    rejectedReason: req.rejectedReason,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "leave.read")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลการลา" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ data: requests.map(serializeLeaveRequest) });
  } catch (error) {
    console.error("GET leave requests error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "leave.request.create")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ยื่นคำขอลา" }, { status: 403 });
    }

    const body = await req.json();
    const result = createLeaveRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง", errors: result.error.flatten() }, { status: 400 });
    }

    const { employeeId, leaveType, startDate, endDate, reason, attachmentUrl } = result.data;
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ message: "ไม่พบพนักงานที่ลาในระบบ" }, { status: 404 });
    }

    const totalDays = calculateDays(startDate, endDate);
    if (totalDays === -1) {
      return NextResponse.json({ message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น" }, { status: 400 });
    }
    if (totalDays === 0) {
      return NextResponse.json({ message: "ช่วงวันที่ลาไม่มีวันทำงาน (เป็นวันเสาร์-อาทิตย์)" }, { status: 400 });
    }

    if (["vacation", "sick", "personal", "annual"].includes(leaveType)) {
      const year = new Date(startDate).getFullYear();
      let balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_year: { employeeId, year } }
      });

      if (!balance) {
        // Auto-initialize LeaveBalance on-the-fly
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

      const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
      const allocatedKey = `${mappedType}Allocated` as keyof typeof balance;
      const usedKey = `${mappedType}Used` as keyof typeof balance;
      
      const allocated = (balance[allocatedKey] as number) || 0;
      const used = (balance[usedKey] as number) || 0;
      const available = allocated - used;

      if (totalDays > available) {
        return NextResponse.json({
          message: `ยอดวันลาคงเหลือไม่เพียงพอ ขอลา: ${totalDays} วัน, คงเหลือ: ${available} วัน`
        }, { status: 400 });
      }
    }

    const dbLeaveType = leaveType === "vacation" ? "annual" : leaveType;
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: dbLeaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        days: totalDays,
        reason,
        attachmentUrl: attachmentUrl || null
      },
      include: {
        employee: true
      }
    });

    return NextResponse.json({ data: serializeLeaveRequest(request) }, { status: 201 });
  } catch (error) {
    console.error("POST leave request error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
