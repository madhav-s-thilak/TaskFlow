import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken, setSessionCookie } from "@/lib/auth"
import { loginSchema } from "@/lib/validations"
import { err, handleError } from "@/lib/api"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return err("Invalid credentials", 401)

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return err("Invalid credentials", 401)

    const token = await signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name })
    await setSessionCookie(res, token)
    return res
  } catch (e) {
    return handleError(e)
  }
}
