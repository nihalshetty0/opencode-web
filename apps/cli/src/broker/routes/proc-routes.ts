import { Router } from "express"

import { BROKER_HOST } from "../../lib"
import type { Instance } from "../../types"

export default function createProcRoutes(instances: Instance[]) {
  const router = Router()

  router.post("/register", (req, res) => {
    const { cwd, port: instancePort } = req.body as {
      cwd?: string
      port?: number
    }
    if (!cwd || !instancePort)
      return res.status(400).send("Missing cwd or port")
    let inst = instances.find((i) => i.cwd === cwd)
    if (inst) {
      inst.port = instancePort
      inst.lastSeen = Date.now()
      inst.status = "online"
    } else {
      instances.push({
        cwd,
        port: instancePort,
        host: BROKER_HOST,
        status: "online",
        lastSeen: Date.now(),
      })
    }
    res.sendStatus(200)
  })

  router.post("/ping", (req, res) => {
    const { cwd, port: instancePort } = req.body as {
      cwd?: string
      port?: number
    }
    if (!cwd || !instancePort)
      return res.status(400).send("Missing cwd or port")
    const inst = instances.find((i) => i.cwd === cwd && i.port === instancePort)
    if (inst) inst.lastSeen = Date.now()
    res.sendStatus(200)
  })

  router.post("/deregister", (req, res) => {
    const { cwd } = req.body as { cwd?: string }
    if (!cwd) return res.status(400).send("Missing cwd")
    const inst = instances.find((i) => i.cwd === cwd)
    if (inst) inst.status = "offline"
    res.json({ instances })
  })

  return router
}
