import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database…")

  // Clear existing data
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash("password123", 12)

  const alice = await prisma.user.create({
    data: {
      email: "alice@demo.com",
      name: "Alice Johnson",
      passwordHash,
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: "bob@demo.com",
      name: "Bob Smith",
      passwordHash,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await prisma.$transaction(async (tx: any) => {
    const p = await tx.project.create({
      data: {
        name: "Website Redesign",
        description: "Complete overhaul of the company website with new branding and improved UX.",
        ownerId: alice.id,
      },
    })
    await tx.projectMember.create({
      data: { userId: alice.id, projectId: p.id, role: "ADMIN" },
    })
    await tx.projectMember.create({
      data: { userId: bob.id, projectId: p.id, role: "MEMBER" },
    })
    return p
  })

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.task.createMany({
    data: [
      {
        title: "Define brand identity and color palette",
        description: "Work with design team to establish new brand guidelines.",
        status: "DONE",
        priority: "HIGH",
        projectId: project.id,
        createdById: alice.id,
        assigneeId: alice.id,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Create wireframes for key pages",
        description: "Home, About, Services, and Contact pages need wireframes.",
        status: "DONE",
        priority: "HIGH",
        projectId: project.id,
        createdById: alice.id,
        assigneeId: bob.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Build responsive navigation component",
        description: "Mobile-first responsive nav with hamburger menu.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: project.id,
        createdById: alice.id,
        assigneeId: bob.id,
        dueDate: today,
      },
      {
        title: "Implement hero section animations",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        projectId: project.id,
        createdById: bob.id,
        assigneeId: bob.id,
        dueDate: yesterday, // overdue
      },
      {
        title: "Write copy for all sections",
        description: "Marketing copy for all 6 main sections.",
        status: "TODO",
        priority: "MEDIUM",
        projectId: project.id,
        createdById: alice.id,
        assigneeId: alice.id,
        dueDate: nextWeek,
      },
      {
        title: "Set up analytics and tracking",
        description: "Integrate GA4 and set up conversion events.",
        status: "TODO",
        priority: "LOW",
        projectId: project.id,
        createdById: alice.id,
        assigneeId: null,
        dueDate: null,
      },
    ],
  })

  console.log("✅ Seed complete!")
  console.log("   alice@demo.com / password123  (ADMIN)")
  console.log("   bob@demo.com   / password123  (MEMBER)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
