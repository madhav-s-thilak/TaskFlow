import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken, setSessionCookie } from "@/lib/auth"
import { signupSchema } from "@/lib/validations"
import { err, handleError } from "@/lib/api"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) return err("Validation error", 400, parsed.error.flatten())

    const { email, name, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return err("Email already in use", 409)

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, name, passwordHash } })

    const token = await signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    )
    await setSessionCookie(res, token)
    return res
  } catch (e) {
    return handleError(e)
  }
}
