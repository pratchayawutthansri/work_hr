import prisma from "./prisma";

export async function createAuditLog({
  actorId,
  action,
  resource,
  resourceId,
  before,
  after,
  req
}: {
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  before: any;
  after: any;
  req: Request;
}) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;
    
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        resource,
        resourceId,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        ipAddress,
        userAgent
      }
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
}
