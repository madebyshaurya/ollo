export interface Project {
  id: string
  name: string
  description: string
  type: "breadboard" | "pcb"
  createdAt: Date
  status: "planning" | "in-progress" | "completed"
}

// Mock data for demonstration - empty for clean start
export const mockProjects: Project[] = []
