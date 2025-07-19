#!/usr/bin/env tsx
import cors from "cors"
import express from "express"

import { BROKER_HOST } from "../lib.js"
import type { Instance } from "../types"
import createProcRoutes from "./routes/proc-routes.js"
import createPublicRoutes from "./routes/public-routes.js"

// ESM __dirname shim

const port = parseInt(process.argv[2] ?? "", 10)
if (!port) {
  console.error("Broker: No port provided. Usage: broker.js <port>")
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

let instances: Instance[] = []

// mount route modules
app.use("/", createProcRoutes(instances))
app.use("/", createPublicRoutes(instances))

app.listen(port, BROKER_HOST, () => {
  console.log(`Broker running at http://${BROKER_HOST}:${port}`)
})
