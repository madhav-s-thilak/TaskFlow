import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { requireProjectRole } from "@/lib/rbac"
import { createTaskSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"
import { TaskStatus } from "@/generated/prisma/enums"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: projectId } = await params
    await requireProjectRole(session.userId, projectId, "MEMBER")

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status") as TaskStatus | null
    const assigneeId = searchParams.get("assigneeId")

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
        ...(assigneeId ? { assigneeId } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return ok(tasks)
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: projectId } = await params
    await requireProjectRole(session.userId, projectId, "MEMBER")

    const body = await req.json()
    const parsed = createTaskSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { title, description, priority, dueDate, assigneeId } = parsed.data

    // Verify assignee is a project member
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId } },
      })
      if (!assigneeMembership) return err("Assignee must be a project member", 400)
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId ?? null,
        createdById: session.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return ok(task, 201)
  } catch (e) {
    return handleError(e)
  }
}
