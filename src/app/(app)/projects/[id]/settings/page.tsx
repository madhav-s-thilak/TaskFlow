import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { ProjectSettingsClient } from "@/components/project-settings-client"

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id: projectId } = await params

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: session.userId, projectId } },
  })

  if (!membership || membership.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Access Denied</h1>
        <p className="text-zinc-500">Only admins can access project settings.</p>
      </div>
    )
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  })

  if (!project) notFound()

  return <ProjectSettingsClient project={project} currentUserId={session.userId} />
}
