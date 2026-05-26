import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { requireProjectRole, RBACError } from "@/lib/rbac"
import { updateMemberRoleSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"

async function ensureNotLastAdmin(projectId: string, excludeUserId: string) {
  const adminCount = await prisma.projectMember.count({
    where: { projectId, role: "ADMIN", userId: { not: excludeUserId } },
  })
  if (adminCount === 0) {
    throw new RBACError("Cannot remove or demote the last admin", 400)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: projectId, userId: targetUserId } = await params
    await requireProjectRole(session.userId, projectId, "ADMIN")

    const body = await req.json()
    const parsed = updateMemberRoleSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { role: newRole } = parsed.data

    // If demoting from ADMIN, ensure there's another admin
    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    })
    if (!target) return err("Member not found", 404)

    if (target.role === "ADMIN" && newRole === "MEMBER") {
      await ensureNotLastAdmin(projectId, targetUserId)
    }

    const updated = await prisma.projectMember.update({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      data: { role: newRole },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return ok(updated)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: projectId, userId: targetUserId } = await params

    const sessionMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.userId, projectId } },
    })
    if (!sessionMembership) return err("Not a member", 403)

    const isSelf = session.userId === targetUserId
    const isAdmin = sessionMembership.role === "ADMIN"

    if (!isSelf && !isAdmin) return err("Insufficient permissions", 403)

    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    })
    if (!target) return err("Member not found", 404)

    // Prevent removing the last admin
    if (target.role === "ADMIN") {
      await ensureNotLastAdmin(projectId, targetUserId)
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    })

    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
