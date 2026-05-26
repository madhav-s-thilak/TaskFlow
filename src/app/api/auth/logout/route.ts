import { NextResponse } from "next/server"
import { requireAuth, clearSessionCookie } from "@/lib/auth"
import { handleError } from "@/lib/api"

export async function POST() {
  try {
    await requireAuth()
    const res = NextResponse.json({ ok: true })
    await clearSessionCookie(res)
    return res
  } catch (e) {
    return handleError(e)
  }
}
