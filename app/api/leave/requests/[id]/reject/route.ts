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
      return NextResponse.json({ message: "ไม่มีสิทธิ์ปฏิเสธใบลา" }, { status: 403 });
    }

    const { id } = await params;
    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return NextResponse.json({ message: "ไม่พบใบลาที่ต้องการปฏิเสธ" }, { status: 404 });
    }
    if (request.status !== "pending") {
      return NextResponse.json({ message: "สามารถปฏิเสธได้เฉพาะใบลาที่รออนุมัติเท่านั้น" }, { status: 409 });
    }

    let rejectedReason = "Rejected by approver";
    try {
      const body = await req.json();
      if (body && body.rejectedReason) {
        rejectedReason = body.rejectedReason;
      }
    } catch {
      // Body might be empty, use default reason
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "rejected",
        approverId: user.id,
        approvedBy: user.id,
        rejectedReason
      },
      include: {
        employee: true
      }
    });

    const serializedBefore = serializeLeaveRequest(request);
    const serializedAfter = serializeLeaveRequest(updatedRequest);

    await createAuditLog({
      actorId: user.id,
      action: "reject",
      resource: "leave_request",
      resourceId: id,
      before: serializedBefore,
      after: serializedAfter,
      req
    });

    return NextResponse.json({ data: serializedAfter });
  } catch (error) {
    console.error("Reject leave request error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
