import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "leave.approve")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์อนุมัติใบลา" }, { status: 403 });
    }

    const { id } = await params;
    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return NextResponse.json({ message: "ไม่พบใบลาที่ต้องการอนุมัติ" }, { status: 404 });
    }
    if (request.status !== "pending") {
      return NextResponse.json({ message: "สามารถอนุมัติได้เฉพาะใบลาที่รออนุมัติเท่านั้น" }, { status: 409 });
    }

    const { employeeId, leaveType, startDate } = request;
    const daysToDeduct = request.days || request.totalDays || 0;
    const year = new Date(startDate).getFullYear();

    if (["vacation", "sick", "personal", "annual"].includes(leaveType)) {
      const mappedType = leaveType === "vacation" || leaveType === "annual" ? "annual" : leaveType;
      const usedField = `${mappedType}Used`;
      const remainingField = `${mappedType}Remaining`;
      const allocatedField = `${mappedType}Allocated`;

      try {
        await prisma.$transaction(async (tx: any) => {
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

          const currentUsed = balance[usedField as keyof typeof balance] as number || 0;
          const allocated = balance[allocatedField as keyof typeof balance] as number || 0;
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
      } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "approved",
        approverId: user.id,
        approvedBy: user.id,
        approvedAt: new Date()
      },
      include: {
        employee: true
      }
    });

    const serializedBefore = serializeLeaveRequest(request);
    const serializedAfter = serializeLeaveRequest(updatedRequest);

    await createAuditLog({
      actorId: user.id,
      action: "approve",
      resource: "leave_request",
      resourceId: id,
      before: serializedBefore,
      after: serializedAfter,
      req
    });

    return NextResponse.json({ data: serializedAfter });
  } catch (error) {
    console.error("Approve leave request error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
