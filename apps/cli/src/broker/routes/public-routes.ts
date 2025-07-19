import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import { Router } from "express"

import type { Instance } from "../../types"

const __filename = fileURLToPath(import.meta.url)
const ROUTES_DIR = path.dirname(__filename)
const BROKER_DIR = path.dirname(ROUTES_DIR) // up one level to broker folder

export default function createPublicRoutes(instances: Instance[]) {
  const router = Router()

  // helper to mark stale
  const INSTANCE_STALE_TIMEOUT_MS = 30000
  function updateInstanceStatus() {
    const now = Date.now()
    for (const inst of instances) {
      if (inst.lastSeen && now - inst.lastSeen > INSTANCE_STALE_TIMEOUT_MS) {
        inst.status = "offline"
      }
    }
  }

  router.get("/instances", (_req, res) => {
    updateInstanceStatus()
    res.json({ version: "1.0.0", info: { name: "opencode-web" }, instances })
  })

  // Helper to wait for registration/offline
  function waitFor(cond: () => boolean, timeoutMs = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now()
      const timer = setInterval(() => {
        if (cond()) {
          clearInterval(timer)
          resolve(true)
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(timer)
          resolve(false)
        }
      }, 200)
    })
  }

  // POST /instance -> start
  router.post("/instance", async (req, res) => {
    const { cwd } = req.body as { cwd?: string }
    if (!cwd) return res.status(400).send("Missing cwd")

    const existing = instances.find(
      (i) => i.cwd === cwd && i.status === "online"
    )
    if (existing)
      return res.status(409).json({ message: "Instance already running" })

    const daemonPath = path.join(BROKER_DIR, "..", "opencode-proc", "index.ts")
    const proc = spawn("tsx", [daemonPath, cwd], {
      cwd,
      detached: false,
      stdio: "ignore",
      shell: true,
    })

    const ok = await waitFor(() =>
      Boolean(instances.find((i) => i.cwd === cwd && i.status === "online"))
    )

    if (ok) {
      proc.unref()
      const inst = instances.find(
        (i) => i.cwd === cwd && i.status === "online"
      )!
      return res
        .status(201)
        .json({ message: "Instance ready", port: inst.port })
    }

    try {
      proc.kill()
    } catch {}
    return res.status(500).json({ error: "startup timeout" })
  })

  // DELETE /instance -> stop
  router.delete("/instance", async (req, res) => {
    const { cwd } = req.body as { cwd?: string }
    if (!cwd) return res.status(400).send("Missing cwd")

    const inst = instances.find((i) => i.cwd === cwd && i.status === "online")
    if (!inst) return res.status(404).json({ message: "Instance not found" })

    try {
      await fetch(`http://localhost:${inst.port}/__shutdown`, {
        method: "POST",
      })
    } catch {}

    const ok = await waitFor(
      () => !instances.find((i) => i.cwd === cwd && i.status === "online")
    )

    if (ok) return res.json({ message: "Instance stopped" })
    return res.status(500).json({ error: "shutdown timeout" })
  })

  return router
}
