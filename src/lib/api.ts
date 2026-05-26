import { AuthError } from "@/lib/auth"
import { RBACError } from "@/lib/rbac"
import { ZodError } from "zod"

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status })
}

export function err(message: string, status: number, details?: unknown) {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status })
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) return err(e.message, e.status)
  if (e instanceof RBACError) return err(e.message, e.status)
  if (e instanceof ZodError) return err("Validation error", 400, e.flatten())
  console.error(e)
  return err("Internal server error", 500)
}
