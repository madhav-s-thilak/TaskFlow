import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { requireProjectRole, RBACError } from "@/lib/rbac"
import { updateTaskSchema } from "@/lib/validations"
import { ok, err, handleError } from "@/lib/api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!task) return err("Task not found", 404)

    await requireProjectRole(session.userId, task.projectId, "MEMBER")
    return ok(task)
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

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return err("Task not found", 404)

    const { role } = await requireProjectRole(session.userId, task.projectId, "MEMBER")

    // Members can only edit tasks they created or are assigned to
    const isAdmin = role === "ADMIN"
    const isCreator = task.createdById === session.userId
    const isAssignee = task.assigneeId === session.userId
    if (!isAdmin && !isCreator && !isAssignee) {
      throw new RBACError("You can only edit tasks you created or are assigned to", 403)
    }

    const body = await req.json()
    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const data = parsed.data

    // Verify new assignee is a project member
    if (data.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: data.assigneeId, projectId: task.projectId } },
      })
      if (!assigneeMembership) return err("Assignee must be a project member", 400)
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
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

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return err("Task not found", 404)

    await requireProjectRole(session.userId, task.projectId, "ADMIN")

    await prisma.task.delete({ where: { id } })
    return ok({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
