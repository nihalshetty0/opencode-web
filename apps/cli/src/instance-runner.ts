#!/usr/bin/env node
import { spawn } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"
import cors from "cors"
import express from "express"
import getPort from "get-port"
import { createProxyMiddleware } from "http-proxy-middleware"

import { WEB_APP_BASE_URL } from "./lib.js"
import type { InstanceRecord } from "./types.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/*************************
 *  Constants
 *************************/

const INSTANCES_DIR = path.join(os.homedir(), ".opencode-web")
const INSTANCES_FILE = path.join(INSTANCES_DIR, "instances.json")

/*************************
 *  Instance file management
 *************************/

function ensureInstancesDir() {
  if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true })
  }
}

function readInstances(): InstanceRecord[] {
  ensureInstancesDir()
  if (!fs.existsSync(INSTANCES_FILE)) {
    return []
  }
  try {
    const content = fs.readFileSync(INSTANCES_FILE, "utf8")
    return JSON.parse(content) as InstanceRecord[]
  } catch {
    return []
  }
}

function writeInstances(instances: InstanceRecord[]) {
  ensureInstancesDir()
  fs.writeFileSync(INSTANCES_FILE, JSON.stringify(instances, null, 2))
}

function addInstance(instance: InstanceRecord) {
  const instances = readInstances()
  instances.push(instance)
  writeInstances(instances)
}

function removeInstanceByCwd(cwd: string) {
  const instances = readInstances()
  const filtered = instances.filter((inst) => inst.cwd !== cwd)
  writeInstances(filtered)
}

/*************************
 *  Main logic
 *************************/

const projectDir = path.resolve(process.argv[2] ?? process.cwd())

;(async () => {
  try {
    // Get ports
    const proxyPort = await getPort({ port: 15096 })
    const opencodePort = await getPort({ port: 11923 })

    console.log(
      `Starting opencode server in ${projectDir} on port ${opencodePort}`
    )

    // Start opencode server
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
      console.log(`Opencode server exited with code ${code} (signal ${signal})`)
      // Clean up instance record and exit
      removeInstanceByCwd(projectDir)
      process.exit(code ?? 1)
    })

    // Wait a bit for opencode to start
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Start proxy server
    const app = express()
    app.use(cors())

    // Proxy all API requests to opencode server
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

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", cwd: projectDir, port: proxyPort })
    })

    // Start proxy server
    const server = app.listen(proxyPort, "127.0.0.1", () => {
      const url = `${WEB_APP_BASE_URL}/?port=${proxyPort}`

      console.log(`Proxy server started on http://127.0.0.1:${proxyPort}`)
      console.log(`Web interface: ${url}`)

      // Add to instances file
      const instance: InstanceRecord = {
        cwd: projectDir,
        port: proxyPort,
        pid: process.pid,
        url,
        startedAt: new Date().toISOString(),
      }

      addInstance(instance)
    })

    // Handle cleanup on process termination
    const cleanup = () => {
      console.log("Cleaning up instance...")
      removeInstanceByCwd(projectDir)
      opencodeProc.kill()
      server.close()
      process.exit(0)
    }

    process.on("SIGINT", cleanup)
    process.on("SIGTERM", cleanup)
    process.on("exit", () => {
      removeInstanceByCwd(projectDir)
    })

    // Keep the process alive
    process.stdin.resume()
  } catch (error) {
    console.error("Failed to start instance:", error)
    process.exit(1)
  }
})()
