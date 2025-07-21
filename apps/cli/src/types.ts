export interface Instance {
  cwd: string
  port: number
  host: string
  status: "online" | "offline"
  lastSeen?: number
  startedAt: number
}
