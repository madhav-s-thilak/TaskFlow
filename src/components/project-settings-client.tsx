"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MemberList } from "@/components/member-list"
import { updateProjectSchema, addMemberSchema } from "@/lib/validations"
import type { Role } from "@/generated/prisma/enums"

interface Member {
  id: string
  userId: string
  role: Role
  user: { id: string; name: string; email: string }
}

interface Project {
  id: string
  name: string
  description: string | null
  members: Member[]
}

type UpdateForm = z.infer<typeof updateProjectSchema>
type AddMemberForm = z.infer<typeof addMemberSchema>

export function ProjectSettingsClient({
  project,
  currentUserId,
}: {
  project: Project
  currentUserId: string
}) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newMemberRole, setNewMemberRole] = useState<Role>("MEMBER")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isSaving },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  })

  const {
    register: registerMember,
    handleSubmit: handleMemberSubmit,
    reset: resetMember,
    formState: { errors: memberErrors, isSubmitting: isAddingMember },
  } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: "MEMBER" },
  })

  async function onSaveProject(data: UpdateForm) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success("Project updated")
      router.refresh()
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to update project")
    }
  }

  async function onAddMember(data: AddMemberForm) {
    const res = await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, role: newMemberRole }),
    })
    if (res.ok) {
      toast.success("Member added")
      resetMember()
      setAddOpen(false)
      router.refresh()
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to add member")
    }
  }

  async function onDeleteProject() {
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Project deleted")
      router.push("/projects")
    } else {
      const body = await res.json()
      toast.error(body.error || "Failed to delete project")
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Project Settings</h1>
        <p className="text-zinc-500 mt-1">{project.name}</p>
      </div>

      {/* Project Info */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Project information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProject)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription className="mt-1">{project.members.length} member{project.members.length !== 1 ? "s" : ""}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" /> Add member
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add member</DialogTitle>
                <DialogDescription>Invite an existing user by email.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMemberSubmit(onAddMember)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      {...registerMember("email")}
                      aria-invalid={!!memberErrors.email}
                    />
                    {memberErrors.email && (
                      <p className="text-xs text-red-500">{memberErrors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={newMemberRole}
                      onValueChange={(v) => setNewMemberRole(v as Role)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    disabled={isAddingMember}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isAddingMember ? "Adding…" : "Add member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <MemberList
            projectId={project.id}
            initialMembers={project.members}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-xl shadow-sm border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this project and all its tasks and memberships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete project
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete &ldquo;{project.name}&rdquo;?</DialogTitle>
                <DialogDescription>
                  This will permanently delete the project and all its tasks and memberships. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={onDeleteProject}
                >
                  Yes, delete project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
