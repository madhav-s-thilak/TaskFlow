import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

export class RBACError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

const ROLE_RANK: Record<Role, number> = {
  ADMIN: 2,
  MEMBER: 1,
}

export async function requireProjectRole(
  userId: string,
  projectId: string,
  minRole: Role
): Promise<{ role: Role; membership: { id: string; userId: string; projectId: string; role: Role; joinedAt: Date } }> {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })

  if (!membership) {
    // Check if project exists at all
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new RBACError("Project not found", 404)
    throw new RBACError("You are not a member of this project", 403)
  }

  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new RBACError("Insufficient permissions", 403)
  }

  return { role: membership.role, membership }
}

export function isMemberOrAbove(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK["MEMBER"]
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN"
}
