import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

function serializeUser(user: any) {
  return {
    _id: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    permissions: user.permissions,
    status: user.status
  };
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" }, { status: 401 });
  }
  return NextResponse.json({ user: serializeUser(user) });
}
