import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { createProjectSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"

export async function GET() {
  try {
    const session = await requireAuth()

    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.userId },
      include: {
        project: {
          include: {
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
      orderBy: { project: { updatedAt: "desc" } },
    })

    const projects = memberships.map((m) => ({
      ...m.project,
      role: m.role,
      memberCount: m.project._count.members,
      taskCount: m.project._count.tasks,
    }))

    return ok(projects)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { name, description } = parsed.data

    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: { name, description, ownerId: session.userId },
      })
      await tx.projectMember.create({
        data: { userId: session.userId, projectId: p.id, role: "ADMIN" },
      })
      return p
    })

    return ok(project, 201)
  } catch (e) {
    return handleError(e)
  }
}
