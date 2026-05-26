"use client"

import Link from "next/link"
import { format, isPast } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, AlertCircle, Timer, FolderKanban, TrendingUp } from "lucide-react"
import type { TaskStatus, Priority, Role } from "@/generated/prisma/enums"

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  project: { id: string; name: string }
  assignee: { id: string; name: string } | null
}

interface Project {
  id: string
  name: string
  description: string | null
  role: Role
  memberCount: number
  taskCount: number
}

interface DashboardData {
  totalTasks: number
  byStatus: { TODO: number; IN_PROGRESS: number; DONE: number }
  overdue: number
  dueSoon: number
  recentTasks: Task[]
  projects: Project[]
}

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  TODO: { label: "To Do", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  DONE: { label: "Done", variant: "outline" },
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const stats = [
    {
      label: "Total Tasks",
      value: data.totalTasks,
      icon: CheckSquare,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "To Do",
      value: data.byStatus.TODO,
      icon: Clock,
      color: "text-zinc-600",
      bg: "bg-zinc-100",
    },
    {
      label: "In Progress",
      value: data.byStatus.IN_PROGRESS,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Done",
      value: data.byStatus.DONE,
      icon: CheckSquare,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Overdue",
      value: data.overdue,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Due Soon",
      value: data.dueSoon,
      icon: Timer,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Overview of your work across all projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className={`size-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100">
            {data.recentTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No tasks yet</p>
            ) : (
              data.recentTasks.map((task) => {
                const isOverdue =
                  task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE"
                return (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${task.project.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-indigo-600 truncate block"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-0.5">{task.project.name}</p>
                      {task.dueDate && (
                        <p
                          className={`text-xs mt-1 ${isOverdue ? "text-red-500 font-medium" : "text-zinc-400"}`}
                        >
                          {isOverdue ? "Overdue · " : "Due "}
                          {format(new Date(task.dueDate), "MMM d")}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusConfig[task.status].variant} className="shrink-0 text-xs">
                      {statusConfig[task.status].label}
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">My Projects</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100">
            {data.projects.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No projects yet</p>
            ) : (
              data.projects.slice(0, 5).map((project) => (
                <div key={project.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <FolderKanban className="size-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-indigo-600 truncate block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {project.memberCount} member{project.memberCount !== 1 ? "s" : ""} · {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={project.role === "ADMIN" ? "default" : "secondary"} className="text-xs shrink-0">
                    {project.role === "ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
