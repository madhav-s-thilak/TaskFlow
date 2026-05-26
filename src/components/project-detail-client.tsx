"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { format, isPast } from "date-fns"
import { Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskCard } from "@/components/task-card"
import { TaskDialog } from "@/components/task-dialog"
import { cn } from "@/lib/utils"
import type { TaskStatus, Priority, Role } from "@/generated/prisma/enums"

interface Member {
  id: string
  name: string
  email: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  assigneeId: string | null
  createdById: string
  assignee: Member | null
  createdBy: { id: string; name: string }
}

interface ProjectMember {
  id: string
  userId: string
  role: Role
  user: Member
}

interface Project {
  id: string
  name: string
  description: string | null
  members: ProjectMember[]
  tasks: Task[]
}

interface ProjectDetailClientProps {
  project: Project
  role: Role
  currentUserId: string
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
]

const columnStyle: Record<TaskStatus, string> = {
  TODO: "bg-zinc-50 border-zinc-200",
  IN_PROGRESS: "bg-blue-50 border-blue-100",
  DONE: "bg-green-50 border-green-100",
}

export function ProjectDetailClient({ project, role, currentUserId }: ProjectDetailClientProps) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")

  const members = project.members.map((m) => m.user)

  function openCreate(status: TaskStatus) {
    setEditTask(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditTask(task)
    setDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleTaskSuccess(incoming: any) {
    const task = incoming as Task
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id)
      if (exists) return prev.map((t) => (t.id === task.id ? { ...t, ...task } : t))
      return [task, ...prev]
    })
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false
      if (filterAssignee !== "all" && t.assigneeId !== filterAssignee) return false
      return true
    })
  }, [tasks, filterStatus, filterAssignee])

  const isAdmin = role === "ADMIN"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900 truncate">{project.name}</h1>
            <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs shrink-0">
              {isAdmin ? "Admin" : "Member"}
            </Badge>
          </div>
          {project.description && (
            <p className="text-zinc-500 text-sm">{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <Link href={`/projects/${project.id}/settings`}>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Settings className="size-4" /> Settings
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        {/* Kanban Board */}
        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {COLUMNS.map(({ status, label }) => {
              const columnTasks = tasks.filter((t) => t.status === status)
              return (
                <div
                  key={status}
                  className={cn("rounded-xl border p-3 flex flex-col gap-3 min-h-[300px]", columnStyle[status])}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-700">{label}</span>
                      <span className="text-xs text-zinc-400 bg-white rounded-full px-1.5 py-0.5 border border-zinc-200">
                        {columnTasks.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openCreate(status)}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => openEdit(task)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="mt-4 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAssignee} onValueChange={(v) => setFilterAssignee(v ?? "all")}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Assignee</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-400">No tasks found</td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isOverdue =
                        task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE"
                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-zinc-50 cursor-pointer"
                          onClick={() => openEdit(task)}
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">{task.title}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <PriorityLabel priority={task.priority} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-zinc-500">
                            {task.assignee?.name ?? "—"}
                          </td>
                          <td className={cn("px-4 py-3 hidden lg:table-cell text-xs", isOverdue ? "text-red-500 font-medium" : "text-zinc-500")}>
                            {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => openCreate("TODO")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Plus className="size-4" /> Add task
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={project.id}
        members={members}
        task={editTask}
        defaultStatus={defaultStatus}
        onSuccess={handleTaskSuccess}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; className: string }> = {
    TODO: { label: "To Do", className: "bg-zinc-100 text-zinc-600" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
    DONE: { label: "Done", className: "bg-green-100 text-green-700" },
  }
  const c = config[status]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", c.className)}>
      {c.label}
    </span>
  )
}

function PriorityLabel({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; color: string }> = {
    LOW: { label: "Low", color: "text-zinc-400" },
    MEDIUM: { label: "Medium", color: "text-amber-500" },
    HIGH: { label: "High", color: "text-red-500" },
  }
  const c = config[priority]
  return <span className={cn("text-xs font-medium", c.color)}>{c.label}</span>
}
