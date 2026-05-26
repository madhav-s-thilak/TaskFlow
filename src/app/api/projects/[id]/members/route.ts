import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { requireProjectRole } from "@/lib/rbac"
import { addMemberSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: projectId } = await params
    await requireProjectRole(session.userId, projectId, "ADMIN")

    const body = await req.json()
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { email, role } = parsed.data

    const userToAdd = await prisma.user.findUnique({ where: { email } })
    if (!userToAdd) return err("User not found", 404)

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } },
    })
    if (existing) return err("User is already a member", 409)

    const member = await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return ok(member, 201)
  } catch (e) {
    return handleError(e)
  }
}
