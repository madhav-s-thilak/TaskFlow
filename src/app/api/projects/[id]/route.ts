import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { requireProjectRole } from "@/lib/rbac"
import { updateProjectSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const { role } = await requireProjectRole(session.userId, id, "MEMBER")

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    })

    if (!project) return err("Project not found", 404)

    return ok({ ...project, role })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectRole(session.userId, id, "ADMIN")

    const body = await req.json()
    const parsed = updateProjectSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
    })

    return ok(project)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    await requireProjectRole(session.userId, id, "ADMIN")

    await prisma.project.delete({ where: { id } })
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
