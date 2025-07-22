#!/usr/bin/env node
import { spawn } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"
import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"

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

function findInstanceByCwd(cwd: string): InstanceRecord | null {
  const instances = readInstances()
  return instances.find((inst) => inst.cwd === cwd) || null
}

function removeInstanceByCwd(cwd: string) {
  const instances = readInstances()
  const filtered = instances.filter((inst) => inst.cwd !== cwd)
  writeInstances(filtered)
}

/*************************
 *  Instance health check
 *************************/

async function isInstanceAlive(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/app`, {
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

/*************************
 *  Process management
 *************************/

async function startOpencodeInstance(projectDir: string): Promise<void> {
  // Launch the instance runner as a detached process
  const runnerPath = path.join(__dirname, "instance-runner.ts")

  const proc = spawn("npx", ["tsx", runnerPath, projectDir], {
    detached: true,
    stdio: "ignore",
    shell: true,
  })

  proc.unref()

  // Wait for the instance to start and register itself
  console.log("Starting instance...")

  // Poll for up to 10 seconds to see if the instance appears in the file
  for (let i = 0; i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const instance = findInstanceByCwd(projectDir)
    if (instance) {
      console.log(`Instance started at: ${instance.url}`)
      return
    }
  }

  console.error("Failed to start instance (timeout)")
  process.exit(1)
}

/*************************
 *  Command handlers
 *************************/

async function handleStart(projectPath?: string) {
  // Resolve project directory
  let projectDir = path.resolve(process.cwd(), projectPath ?? ".")

  // If it's a file, use the directory
  try {
    const stat = fs.statSync(projectDir)
    if (stat.isFile()) {
      projectDir = path.dirname(projectDir)
    }
  } catch {
    console.error(`Path does not exist: ${projectDir}`)
    process.exit(1)
  }

  // Check if instance already exists
  const existingInstance = findInstanceByCwd(projectDir)
  if (existingInstance) {
    // Check if the instance is still alive
    console.log("Checking if instance is running...")
    const isAlive = await isInstanceAlive(existingInstance.port)
    if (isAlive) {
      console.log(`Instance already running at: ${existingInstance.url}`)
      return
    } else {
      // Remove stale instance
      console.log("Removing stale instance...")
      removeInstanceByCwd(projectDir)
    }
  }

  // Start new instance
  await startOpencodeInstance(projectDir)
}

async function handleStop(stopPath?: string) {
  const instances = readInstances()

  if (instances.length === 0) {
    console.log("No instances running.")
    return
  }

  let targetCwd: string

  if (!stopPath) {
    // Stop current directory
    targetCwd = path.resolve(process.cwd())
  } else {
    // Resolve target path
    targetCwd = path.resolve(stopPath)
  }

  const instance = findInstanceByCwd(targetCwd)
  if (!instance) {
    console.log(`No instance found for ${targetCwd}`)
    return
  }

  // Try to kill the process
  try {
    process.kill(instance.pid, "SIGTERM")
    console.log(`Stopped instance for ${targetCwd}`)
  } catch {
    console.log(`Process ${instance.pid} was already dead`)
  }

  // Remove from instances file
  removeInstanceByCwd(targetCwd)
}

async function handleList() {
  const instances = readInstances()

  if (instances.length === 0) {
    console.log("No instances running.")
    return
  }

  console.log("Checking instance health...")
  console.log()
  console.log("CWD\t\t\t\tURL\t\t\tStatus")
  console.log("---\t\t\t\t---\t\t\t------")

  for (const instance of instances) {
    const isAlive = await isInstanceAlive(instance.port)
    if (isAlive) {
      console.log(`${instance.cwd}\t\t${instance.url}\tOnline`)
    } else {
      console.log(`${instance.cwd}\t\t${instance.url}\tOffline (removing)`)
      // Clean up dead instance
      removeInstanceByCwd(instance.cwd)
    }
  }
}

/*************************
 *  CLI definition with yargs
 *************************/

yargs(hideBin(process.argv))
  .scriptName("opencode-web")
  .usage("$0 <command> [options]")
  .command(
    "$0 [path]",
    "Start an opencode instance for the given path (defaults to current directory)",
    (yargs) => {
      return yargs.positional("path", {
        type: "string",
        describe: "Directory or file to analyze",
        default: ".",
      })
    },
    async (argv) => {
      await handleStart(argv.path)
    }
  )
  .command(
    "list",
    "List all running opencode instances",
    () => {},
    async () => {
      await handleList()
    }
  )
  .command(
    "stop [path]",
    "Stop opencode instance for the given path",
    (yargs) => {
      return yargs.positional("path", {
        type: "string",
        describe:
          "Directory path of instance to stop (defaults to current directory)",
      })
    },
    async (argv) => {
      await handleStop(argv.path)
    }
  )
  .example("$0", "Start instance for current directory")
  .example("$0 ./my-project", "Start instance for ./my-project")
  .example("$0 list", "List all running instances")
  .example("$0 stop", "Stop instance for current directory")
  .example("$0 stop /path/to/project", "Stop instance for specific path")
  .help()
  .alias("help", "h")
  .version("1.0.0")
  .alias("version", "v")
  .epilog(
    "For more information, visit: https://github.com/nihalshetty0/opencode-web"
  )
  .strict()
  .demandCommand(0, 1, "", "Too many commands specified")
  .parseAsync()
  .catch((error) => {
    console.error("Error:", error.message)
    process.exit(1)
  })
