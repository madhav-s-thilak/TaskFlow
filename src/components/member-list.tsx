"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Role } from "@/generated/prisma/enums"

interface Member {
  id: string
  userId: string
  role: Role
  user: { id: string; name: string; email: string }
}

interface MemberListProps {
  projectId: string
  initialMembers: Member[]
  currentUserId: string
}

export function MemberList({ projectId, initialMembers, currentUserId }: MemberListProps) {
  const [members, setMembers] = useState(initialMembers)

  async function updateRole(userId: string, role: Role) {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m))
      )
      toast.success("Role updated")
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to update role")
    }
  }

  async function removeMember(userId: string) {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
      toast.success("Member removed")
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to remove member")
    }
  }

  return (
    <div className="divide-y divide-zinc-100">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-indigo-700">
                {member.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {member.user.name}
                {member.userId === currentUserId && (
                  <span className="text-xs text-zinc-400 ml-1">(you)</span>
                )}
              </p>
              <p className="text-xs text-zinc-500 truncate">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={member.role}
              onValueChange={(v) => updateRole(member.userId, v as Role)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMember(member.userId)}
              className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
              title={`Remove ${member.user.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
