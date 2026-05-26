import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { ok, handleError } from "@/lib/api"

export async function GET() {
  try {
    const session = await requireAuth()
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
    return ok(user)
  } catch (e) {
    return handleError(e)
  }
}
