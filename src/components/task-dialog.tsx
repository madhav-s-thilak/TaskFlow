"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTaskSchema } from "@/lib/validations"
import type { TaskStatus, Priority } from "@/generated/prisma/enums"

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
}

type UpdateForm = z.infer<typeof updateTaskSchema>

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  members: Member[]
  task?: Task | null
  defaultStatus?: TaskStatus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (task: any) => void
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
]

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
]

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
  task,
  defaultStatus = "TODO",
  onSuccess,
}: TaskDialogProps) {
  const isEdit = !!task

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateForm>({ resolver: zodResolver(updateTaskSchema) })

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? undefined,
        status: task?.status ?? defaultStatus,
        priority: task?.priority ?? "MEDIUM",
        dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : null,
        assigneeId: task?.assigneeId ?? null,
      })
    }
  }, [open, task, defaultStatus, reset])

  const priority = watch("priority") as Priority | undefined
  const status = watch("status") as TaskStatus | undefined
  const assigneeId = watch("assigneeId") as string | null | undefined

  async function onSubmit(data: UpdateForm) {
    let res: Response
    if (isEdit && task) {
      res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      const { status: _s, ...createData } = data
      res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createData, status: defaultStatus }),
      })
    }

    if (res.ok) {
      const result = await res.json()
      toast.success(isEdit ? "Task updated" : "Task created")
      onSuccess(result)
      onOpenChange(false)
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to save task")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Create task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Task title"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority ?? "MEDIUM"}
                  onValueChange={(v) => setValue("priority", (v ?? "MEDIUM") as Priority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status ?? defaultStatus}
                    onValueChange={(v) => setValue("status", (v ?? defaultStatus) as TaskStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                  defaultValue={
                    task?.dueDate
                      ? new Date(task.dueDate).toISOString().split("T")[0]
                      : undefined
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={assigneeId ?? "none"}
                  onValueChange={(v) => setValue("assigneeId", !v || v === "none" ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
