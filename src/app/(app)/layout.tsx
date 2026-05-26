import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AppNav } from "@/components/app-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav user={session} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  )
}
