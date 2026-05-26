import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard-client"

async function getDashboardData(userId: string) {
  const now = new Date()
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

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
      include: {
        _count: { select: { tasks: true, members: true } },
        members: { where: { userId }, select: { role: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  return {
    totalTasks: tasks.length,
    byStatus: {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length,
    },
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== "DONE").length,
    dueSoon: tasks.filter(
      (t) => t.dueDate && t.dueDate >= now && t.dueDate <= soon && t.status !== "DONE"
    ).length,
    recentTasks: tasks.slice(0, 5),
    projects: projects.map((p) => ({
      ...p,
      role: p.members[0]?.role ?? "MEMBER",
      memberCount: p._count.members,
      taskCount: p._count.tasks,
    })),
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getDashboardData(session.userId)

  return <DashboardClient data={data} />
}
