"use client"

import { format, isPast } from "date-fns"
import { Calendar, User, Flag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TaskStatus, Priority } from "@/generated/prisma/enums"

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: Priority
    dueDate: Date | null
    assignee: { id: string; name: string; email: string } | null
  }
  onClick: () => void
}

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-zinc-400" },
  MEDIUM: { label: "Medium", color: "text-amber-500" },
  HIGH: { label: "High", color: "text-red-500" },
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE"
  const pc = priorityConfig[task.priority]

  return (
    <Card
      className="rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-zinc-200 bg-white"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium text-zinc-900 line-clamp-2">{task.title}</p>
        {task.description && (
          <p className="text-xs text-zinc-400 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn("flex items-center gap-1 text-xs", pc.color)}>
            <Flag className="size-3" />
            {pc.label}
          </span>
          {task.assignee && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <User className="size-3" />
              {task.assignee.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500 font-medium" : "text-zinc-400"
              )}
            >
              <Calendar className="size-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
