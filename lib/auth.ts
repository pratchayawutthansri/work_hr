import jwt from "jsonwebtoken";
import prisma from "./prisma";

export interface DecodedToken {
  sub: string;
  role: string;
}

export async function getCurrentUser(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    if (!token) return null;
    
    const jwtSecret = process.env.JWT_SECRET || "change-this-to-a-long-random-secret";
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        employeeId: true,
        permissions: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user || user.status !== "active") return null;
    
    return user;
  } catch (error) {
    return null;
  }
}

export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions?.includes(permission) || false;
}
