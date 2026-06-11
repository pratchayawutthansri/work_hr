import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "leave.read")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลวันลาสะสม" }, { status: 403 });
    }

    const { employeeId } = await params;
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = Number(yearParam || new Date().getFullYear());

    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId,
          year
        }
      }
    });

    if (!balance) {
      return NextResponse.json({ message: "ไม่พบยอดคงเหลือวันลาสำหรับพนักงานรายนี้ในปีที่ระบุ" }, { status: 404 });
    }

    const formattedBalance = {
      _id: balance.id,
      id: balance.id,
      employeeId: balance.employeeId,
      year: balance.year,
      annual: {
        allocated: balance.annualAllocated,
        used: balance.annualUsed,
        remaining: balance.annualRemaining
      },
      sick: {
        allocated: balance.sickAllocated,
        used: balance.sickUsed,
        remaining: balance.sickRemaining
      },
      personal: {
        allocated: balance.personalAllocated,
        used: balance.personalUsed,
        remaining: balance.personalRemaining
      },
      createdAt: balance.createdAt,
      updatedAt: balance.updatedAt
    };

    return NextResponse.json({ data: formattedBalance });
  } catch (error) {
    console.error("GET leave balance error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
