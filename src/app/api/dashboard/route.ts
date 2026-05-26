import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { ok, handleError } from "@/lib/api"

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.userId
    const now = new Date()
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days

    // Get all projects the user belongs to
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
    const projectIds = memberships.map((m) => m.projectId)

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { _count: { select: { tasks: true, members: true } } },
        orderBy: { updatedAt: "desc" },
      }),
    ])

    const byStatus = {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length,
    }

    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "DONE"
    ).length

    const dueSoon = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate >= now &&
        t.dueDate <= soon &&
        t.status !== "DONE"
    ).length

    return ok({
      totalTasks: tasks.length,
      byStatus,
      overdue,
      dueSoon,
      recentTasks: tasks.slice(0, 5),
      projects,
    })
  } catch (e) {
    return handleError(e)
  }
}
