import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProjectsClient } from "@/components/projects-client"

async function getProjects(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: { _count: { select: { members: true, tasks: true } } },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
  })

  return memberships.map((m) => ({
    ...m.project,
    role: m.role,
    memberCount: m.project._count.members,
    taskCount: m.project._count.tasks,
  }))
}

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const projects = await getProjects(session.userId)

  return <ProjectsClient initialProjects={projects} />
}
