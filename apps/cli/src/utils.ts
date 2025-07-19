#!/usr/bin/env node
import { spawn } from "child_process"
import net from "net"
import path from "path"
import { fileURLToPath } from "url"

import { BROKER_HOST, BROKER_PORT_RANGE } from "./lib"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/*************************
 *  Spawn helpers
 *************************/
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function isBrokerOnPort(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://${BROKER_HOST}:${port}/instances`)
    if (!res.ok) return false
    const data = (await res.json()) as any
    return Array.isArray(data.instances) && data.info?.name === "opencode-web"
  } catch {
    return false
  }
}

// TODO: better way to find broker port
export async function findBrokerPort(): Promise<number | null> {
  for (const p of BROKER_PORT_RANGE) if (await isBrokerOnPort(p)) return p
  return null
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once("error", () => resolve(false))
    srv.once("listening", () => srv.close(() => resolve(true)))
    srv.listen(port, BROKER_HOST)
  })
}

async function spawnDetachedBroker(port: number): Promise<number> {
  const brokerPath = path.join(__dirname, "broker", "index.ts")
  const proc = spawn("tsx", [brokerPath, `${port}`], {
    cwd: path.dirname(brokerPath),
    detached: true,
    stdio: "ignore",
    shell: true,
  })
  proc.unref()
  for (let i = 0; i < 20; i++) {
    await delay(200)
    if (await isBrokerOnPort(port)) return port
  }
  throw new Error(`Failed to start broker on port ${port}`)
}

export async function ensureBroker(): Promise<number> {
  const existing = await findBrokerPort()
  if (existing) return existing
  // start one on free port in range
  for (const p of BROKER_PORT_RANGE) {
    if (await isPortFree(p)) return await spawnDetachedBroker(p)
  }
  throw new Error("Unable to start broker on any allowed port")
}
