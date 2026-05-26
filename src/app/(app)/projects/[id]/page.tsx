import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { ProjectDetailClient } from "@/components/project-detail-client"

async function getProjectData(userId: string, projectId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })
  if (!membership) return null

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) return null

  return { project, role: membership.role }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id } = await params
  const data = await getProjectData(session.userId, id)

  if (!data) notFound()

  return (
    <ProjectDetailClient
      project={data.project}
      role={data.role}
      currentUserId={session.userId}
    />
  )
}
