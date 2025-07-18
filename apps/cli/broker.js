#!/usr/bin/env node
import cors from "cors"
import express from "express"

import { BROKER_HOST } from "./lib.js"

const port = parseInt(process.argv[2], 10)
if (!port) {
  console.error("Broker: No port provided. Usage: broker.js <port>")
  process.exit(1)
}

const STALE_MS = 30000
const app = express()
app.use(cors())
app.use(express.json())

// Registered instances: { cwd, port, host, status, lastSeen }
let instances = []

function updateInstanceStatus() {
  const now = Date.now()
  for (const inst of instances) {
    if (inst.lastSeen && now - inst.lastSeen > STALE_MS) {
      inst.status = "offline"
    }
  }
}

// Register instance
app.post("/register", (req, res) => {
  const { cwd, port } = req.body
  if (!cwd || !port) return res.status(400).send("Missing cwd or port")
  let inst = instances.find((i) => i.cwd === cwd)
  if (inst) {
    inst.port = port
    inst.lastSeen = Date.now()
    inst.status = "online"
  } else {
    instances.push({
      cwd,
      port,
      host: BROKER_HOST,
      status: "online",
      lastSeen: Date.now(),
    })
  }
  res.sendStatus(200)
})

// Ping instance
app.post("/ping", (req, res) => {
  const { cwd, port } = req.body
  if (!cwd || !port) return res.status(400).send("Missing cwd or port")
  let inst = instances.find((i) => i.cwd === cwd && i.port === port)
  if (inst) {
    inst.lastSeen = Date.now()
  }
  res.sendStatus(200)
})

// Deregister instance
app.post("/deregister", (req, res) => {
  const { cwd } = req.body
  if (!cwd) return res.status(400).send("Missing cwd")
  let inst = instances.find((i) => i.cwd === cwd)
  if (inst) {
    inst.status = "offline"
  }
  res.json({ instances })
})

// List instances
app.get("/instances", (req, res) => {
  updateInstanceStatus()
  res.json({ version: "1.0.0", info: { name: "opencode-web" }, instances })
})

app.listen(port, BROKER_HOST, () => {
  console.log(`Broker running at http://${BROKER_HOST}:${port}`)
})
