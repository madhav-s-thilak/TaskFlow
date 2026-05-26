"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { LayoutDashboard, FolderKanban, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SessionPayload } from "@/lib/auth"

interface AppNavProps {
  user: SessionPayload
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
]

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    toast.success("Signed out")
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl flex items-center h-14 gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg shrink-0">
          <div className="size-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            T
          </div>
          <span className="text-zinc-900">TaskFlow</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden sm:block">{user.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-zinc-600 hover:text-zinc-900 gap-1.5"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
