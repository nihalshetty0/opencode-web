#!/usr/bin/env node
import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import cors from "cors"
import express from "express"
import getPort from "get-port"
import { createProxyMiddleware } from "http-proxy-middleware"

import { BROKER_HOST, BROKER_PORT_RANGE } from "./lib.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isBrokerOnPort(port) {
  try {
    const res = await fetch(`http://${BROKER_HOST}:${port}/instances`)
    if (!res.ok) return false
    const data = await res.json()
    return (
      Array.isArray(data.instances) &&
      data.info &&
      data.info.name === "opencode-web"
    )
  } catch {
    return false
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const testServer = express().listen(port, BROKER_HOST, () => {
      testServer.close(() => resolve(true))
    })
    testServer.on("error", () => resolve(false))
  })
}

async function spawnDetachedBroker(port) {
  const brokerPath = path.join(__dirname, "broker.js")
  const proc = spawn(process.execPath, [brokerPath, port], {
    detached: true,
    stdio: "ignore",
  })
  proc.unref()
  // Wait for broker to be ready
  for (let i = 0; i < 20; i++) {
    await delay(200)
    if (await isBrokerOnPort(port)) {
      return port
    }
  }
  throw new Error(`Failed to start broker on port ${port}`)
}

async function findOrStartBroker() {
  // Try to find an existing broker
  for (const port of BROKER_PORT_RANGE) {
    if (await isBrokerOnPort(port)) {
      return port
    }
  }
  console.log("No existing broker found, trying to start one...")
  // Try to start a broker on a free port
  for (const port of BROKER_PORT_RANGE) {
    if (await isPortFree(port)) {
      return await spawnDetachedBroker(port)
    }
  }
  throw new Error("Could not start or find a broker in the allowed port range.")
}

async function registerInstance(brokerPort, proxyPort, cwd) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd, port: proxyPort }),
    })
  } catch (e) {
    console.error("Failed to register with broker:", e)
  }
}

async function pingInstance(brokerPort, proxyPort, cwd) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd, port: proxyPort }),
    })
  } catch (e) {
    // ignore
  }
}

async function deregisterInstance(brokerPort, cwd) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/deregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd }),
    })
  } catch (e) {
    // ignore
  }
}

async function startProxyAndOpencode() {
  const PROXY_PORT = await getPort({ port: 15096 })
  const OPENCODE_PORT = await getPort({ port: 11923 })
  const cwd = process.cwd()

  // Start opencode server
  console.log(`Starting opencode server on port ${OPENCODE_PORT}...`)
  const opencodeProc = spawn("opencode", ["serve", "--port", OPENCODE_PORT], {
    stdio: "inherit",
    shell: true,
    cwd: cwd,
  })

  opencodeProc.on("error", (err) => {
    console.error("Failed to start opencode server:", err)
    process.exit(1)
  })

  opencodeProc.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(
        `opencode server exited with code ${code} (signal: ${signal})`
      )
      process.exit(code || 1)
    }
  })

  const app = express()
  app.use(cors())

  // Proxy /api to opencode server
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://localhost:${OPENCODE_PORT}`,
      changeOrigin: true,
      ws: true,
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*"
        proxyRes.headers["Access-Control-Allow-Headers"] = "*"
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET,POST,PUT,DELETE,OPTIONS"
      },
    })
  )

  app.listen(PROXY_PORT, "127.0.0.1", () => {
    console.log(`Local proxy listening at http://localhost:${PROXY_PORT}`)
    console.log(`Proxying /api requests to http://localhost:${OPENCODE_PORT}`)
    console.log(`Open your web client: https://opencode-web.vercel.app`)
  })

  return { PROXY_PORT }
}

// MAIN
;(async () => {
  // 1. Ensure broker is running
  const brokerPort = await findOrStartBroker()
  console.log(`Broker running on port ${brokerPort}`)

  // 2. Start proxy and opencode
  const { PROXY_PORT } = await startProxyAndOpencode()
  const cwd = process.cwd()

  // 3. Register with broker
  await registerInstance(brokerPort, PROXY_PORT, cwd)
  // Heartbeat every 10s
  const regInterval = setInterval(
    () => pingInstance(brokerPort, PROXY_PORT, cwd),
    10000
  )

  // 4. Deregister on exit
  const cleanup = async () => {
    clearInterval(regInterval)
    await deregisterInstance(brokerPort, cwd)
    process.exit(0)
  }
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
})()
