import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RecentProject {
  path: string
  lastUsed: string
  name: string
}

interface RecentProjectsState {
  projects: RecentProject[]
  addProject: (project: Omit<RecentProject, "lastUsed">) => void
  removeProject: (path: string) => void
  getProjectName: (path: string) => string
}

export const useRecentProjectsStore = create<RecentProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (project) => {
        const { projects } = get()
        const existingIndex = projects.findIndex((p) => p.path === project.path)
        const updatedProject = {
          ...project,
          lastUsed: new Date().toISOString(),
        }

        if (existingIndex >= 0) {
          // Update existing project
          const updatedProjects = [...projects]
          updatedProjects[existingIndex] = updatedProject
          set({ projects: updatedProjects })
        } else {
          // Add new project
          set({ projects: [updatedProject, ...projects] })
        }
      },

      removeProject: (path) => {
        const { projects } = get()
        set({ projects: projects.filter((p) => p.path !== path) })
      },

      getProjectName: (path) => {
        const parts = path.split(/[/\\]/)
        return parts[parts.length - 1] || path
      },
    }),
    {
      name: "opencode-recent-projects",
    }
  )
)
