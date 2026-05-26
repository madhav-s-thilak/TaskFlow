"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, FolderKanban, Users, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { createProjectSchema } from "@/lib/validations"
import type { Role } from "@/generated/prisma/enums"

interface Project {
  id: string
  name: string
  description: string | null
  role: Role
  memberCount: number
  taskCount: number
}

type CreateForm = z.infer<typeof createProjectSchema>

export function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createProjectSchema) })

  async function onSubmit(data: CreateForm) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const project = await res.json()
      setProjects((prev) => [{ ...project, role: "ADMIN", memberCount: 1, taskCount: 0 }, ...prev])
      toast.success("Project created")
      reset()
      setOpen(false)
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to create project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
          <p className="text-zinc-500 mt-1">Manage your projects and team work</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Plus className="size-4" /> New Project
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription>Set up a new project for your team.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Website Redesign"
                    {...register("name")}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="What is this project about?"
                    {...register("description")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? "Creating…" : "Create project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed border-zinc-200 rounded-xl">
          <FolderKanban className="size-12 text-zinc-300" />
          <div className="text-center">
            <p className="font-medium text-zinc-600">No projects yet</p>
            <p className="text-sm text-zinc-400">Create your first project to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-zinc-900 line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <Badge variant={project.role === "ADMIN" ? "default" : "secondary"} className="text-xs shrink-0">
                      {project.role === "ADMIN" ? "Admin" : "Member"}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2 text-sm">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="pt-0 gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="size-3.5" />
                    <span>{project.memberCount} member{project.memberCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CheckSquare className="size-3.5" />
                    <span>{project.taskCount} task{project.taskCount !== 1 ? "s" : ""}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
