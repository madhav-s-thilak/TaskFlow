# TaskFlow — Project Management App

A production-ready, full-stack project management application built with Next.js 16, Prisma, PostgreSQL, and TypeScript.

![Dashboard](./docs/dashboard.png)
![Projects](./docs/projects.png)
![Kanban Board](./docs/board.png)

## Features

- **Authentication** — Custom JWT in httpOnly cookies; signup, login, logout
- **Projects** — Create, update, and delete projects; invite members by email
- **Kanban Board** — Three-column board (To Do / In Progress / Done) with per-column add buttons
- **Task List** — Filterable table view by status and assignee
- **Task Management** — Create/edit tasks with title, description, priority, due date, and assignee
- **RBAC** — Admin vs Member roles; members can only edit their own tasks
- **Dashboard** — Stats overview (total, by status, overdue, due soon) + recent tasks + projects grid
- **Member Management** — Add members by email, change roles, remove members; last-admin guard
- **Overdue Highlighting** — Overdue tasks displayed in red across dashboard and board
- **Responsive UI** — Mobile-friendly with shadcn/ui (Base UI) components and Tailwind CSS v4
- **Toasts** — Sonner toasts on every mutation

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| ORM | Prisma 7 + PostgreSQL |
| Auth | `jose` (JWT) + `bcryptjs` |
| Validation | Zod v4 |
| Forms | react-hook-form + @hookform/resolvers |
| Icons | lucide-react |
| Toasts | sonner |

## Live Demo

**[https://your-app.up.railway.app](https://your-app.up.railway.app)** ← fill in after deploy

**Demo credentials:**

| User | Email | Password | Role |
|---|---|---|---|
| Alice | alice@demo.com | password123 | Admin |
| Bob | bob@demo.com | password123 | Member |

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd Ethara

# 2. Install dependencies
npm install

# 3. Copy env and fill in your values
cp .env.example .env
# Edit .env: set DATABASE_URL to your local Postgres URL
# e.g. postgresql://postgres:password@localhost:5432/taskflow

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed the database
npx prisma db seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with `alice@demo.com` / `password123`.

## API Reference

All routes return JSON. Errors: `{ error: string, details?: any }`.

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | — | `{email, name, password}` | sets cookie |
| POST | `/api/auth/login` | — | `{email, password}` | sets cookie |
| POST | `/api/auth/logout` | ✓ | — | clears cookie |
| GET | `/api/auth/me` | ✓ | — | current user |
| GET | `/api/projects` | ✓ | — | all user projects with role + counts |
| POST | `/api/projects` | ✓ | `{name, description?}` | creator becomes ADMIN |
| GET | `/api/projects/:id` | member | — | project + members + role |
| PATCH | `/api/projects/:id` | ADMIN | `{name?, description?}` | |
| DELETE | `/api/projects/:id` | ADMIN | — | cascades |
| POST | `/api/projects/:id/members` | ADMIN | `{email, role}` | user must exist; 409 if duplicate |
| PATCH | `/api/projects/:id/members/:userId` | ADMIN | `{role}` | cannot demote last admin |
| DELETE | `/api/projects/:id/members/:userId` | ADMIN | — | cannot remove last admin; self-leave for non-admins |
| GET | `/api/projects/:id/tasks` | member | `?status=&assigneeId=` | filterable |
| POST | `/api/projects/:id/tasks` | member | `{title, description?, priority?, dueDate?, assigneeId?}` | |
| GET | `/api/tasks/:id` | member | — | |
| PATCH | `/api/tasks/:id` | see RBAC | partial task fields | |
| DELETE | `/api/tasks/:id` | ADMIN | — | |
| GET | `/api/dashboard` | ✓ | — | stats across all projects |

## RBAC Matrix

| Action | ADMIN | MEMBER |
|---|---|---|
| View project | ✓ | ✓ |
| Edit project info | ✓ | ✗ |
| Delete project | ✓ | ✗ |
| Add/remove/update members | ✓ | ✗ |
| Create tasks | ✓ | ✓ |
| Edit own tasks (created or assigned) | ✓ | ✓ |
| Edit other members' tasks | ✓ | ✗ |
| Delete tasks | ✓ | ✗ |

Last admin cannot be demoted or removed.

## Database Schema

```prisma
enum Role       { ADMIN MEMBER }
enum TaskStatus { TODO IN_PROGRESS DONE }
enum Priority   { LOW MEDIUM HIGH }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  memberships   ProjectMember[]
  ownedProjects Project[]
  createdTasks  Task[]
  assignedTasks Task[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  members ProjectMember[]
  tasks   Task[]
}

model ProjectMember {
  userId    String
  projectId String
  role      Role @default(MEMBER)
  @@unique([userId, projectId])
}

model Task {
  id          String     @id @default(cuid())
  title       String
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  createdById String
}
```

## Deployment (Railway)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Click **Add Plugin** → **PostgreSQL** — Railway auto-sets `DATABASE_URL`
4. Add environment variable: `JWT_SECRET` — generate with `openssl rand -base64 32`
5. Set `NODE_ENV=production`
6. Deploy — `railway.json` runs `prisma migrate deploy && npm start` automatically on each deploy

## Project Structure

```
src/
  app/
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (app)/layout.tsx              # Protected layout
    (app)/dashboard/page.tsx
    (app)/projects/page.tsx
    (app)/projects/[id]/page.tsx  # Kanban + list
    (app)/projects/[id]/settings/page.tsx
    api/auth/{signup,login,logout,me}/route.ts
    api/projects/route.ts
    api/projects/[id]/route.ts
    api/projects/[id]/members/route.ts
    api/projects/[id]/members/[userId]/route.ts
    api/projects/[id]/tasks/route.ts
    api/tasks/[id]/route.ts
    api/dashboard/route.ts
    layout.tsx
    page.tsx
  lib/
    prisma.ts        # Singleton PrismaClient
    auth.ts          # JWT helpers + getSession
    rbac.ts          # requireProjectRole
    validations.ts   # All Zod schemas
    api.ts           # Response helpers
  components/
    ui/              # shadcn/ui components
    app-nav.tsx
    dashboard-client.tsx
    projects-client.tsx
    project-detail-client.tsx
    project-settings-client.tsx
    task-dialog.tsx
    task-card.tsx
    member-list.tsx
  proxy.ts           # Middleware (Next.js 16)
prisma/
  schema.prisma
  seed.ts
railway.json
.env.example
```

## License

MIT
