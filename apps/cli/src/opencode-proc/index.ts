#!/usr/bin/env node
import { spawn } from "child_process"
import path from "path"
import cors from "cors"
import express from "express"
import getPort from "get-port"
import { createProxyMiddleware } from "http-proxy-middleware"

import { BROKER_HOST } from "../lib.js"
import { findBrokerPort } from "../utils.js"

/*************************
 *  Helpers
 *************************/

async function registerInstance(
  brokerPort: number,
  proxyPort: number,
  cwd: string
) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd, port: proxyPort }),
    })
  } catch (e) {
    console.error("Failed to register with broker", e)
  }
}

async function pingInstance(
  brokerPort: number,
  proxyPort: number,
  cwd: string
) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd, port: proxyPort }),
    })
  } catch {}
}

async function deregisterInstance(brokerPort: number, cwd: string) {
  try {
    await fetch(`http://${BROKER_HOST}:${brokerPort}/deregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd }),
    })
  } catch {}
}

/*************************
 *  Main logic
 *************************/
const projectDir = path.resolve(process.argv[2] ?? process.cwd())

;(async () => {
  const brokerPort = await findBrokerPort()
  if (!brokerPort) {
    console.error("Broker not running.")
    process.exit(1)
  }
  console.log(`Broker running on port ${brokerPort}`)

  const proxyPort = await getPort({ port: 15096 })
  const opencodePort = await getPort({ port: 11923 })

  console.log(
    `Starting opencode server in ${projectDir} on port ${opencodePort}`
  )
  const opencodeProc = spawn(
    "opencode",
    ["serve", "--port", `${opencodePort}`],
    {
      cwd: projectDir,
      stdio: "inherit",
      shell: true,
    }
  )

  opencodeProc.on("error", (err) => {
    console.error("Failed to start opencode server", err)
    process.exit(1)
  })

  opencodeProc.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(
        `opencode server exited with code ${code} (signal ${signal})`
      )
      process.exit(code ?? 1)
    }
  })

  const app = express()
  app.use(cors())

  // proxy API
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://localhost:${opencodePort}`,
      changeOrigin: true,
      ws: true,
      onProxyRes: (proxyRes: any) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*"
        proxyRes.headers["Access-Control-Allow-Headers"] = "*"
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET,POST,PUT,DELETE,OPTIONS"
      },
    } as any)
  )

  // shutdown endpoint
  const shutdown = async () => {
    clearInterval(regInterval)
    await deregisterInstance(brokerPort, projectDir)
    server.close(() => process.exit(0))
    opencodeProc.kill()
  }

  app.post("/__shutdown", async (_, res) => {
    res.sendStatus(200)
    await shutdown()
  })

  const server = app.listen(proxyPort, "127.0.0.1", () => {
    console.log(`Local proxy on http://localhost:${proxyPort}`)
    console.log("Open your web client: https://opencode-web.vercel.app")
  })

  await registerInstance(brokerPort, proxyPort, projectDir)
  const regInterval = setInterval(
    () => pingInstance(brokerPort, proxyPort, projectDir),
    10000
  )

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
})()
