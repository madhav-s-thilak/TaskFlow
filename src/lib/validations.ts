import { z } from "zod"
import { TaskStatus, Priority, Role } from "@/generated/prisma/enums"

export const emailSchema = z.string().email().toLowerCase().trim()
export const passwordSchema = z.string().min(8).max(100)
export const nameSchema = z.string().min(1).max(80).trim()
export const projectNameSchema = z.string().min(1).max(100).trim()
export const taskTitleSchema = z.string().min(1).max(200).trim()

export const signupSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: z.string().max(500).trim().optional(),
})

export const updateProjectSchema = z.object({
  name: projectNameSchema.optional(),
  description: z.string().max(500).trim().optional().nullable(),
})

export const addMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(["ADMIN", "MEMBER"] as const),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"] as const),
})

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  description: z.string().max(2000).trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"] as const).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: taskTitleSchema.optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"] as const).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"] as const).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
})

export { TaskStatus, Priority, Role }
