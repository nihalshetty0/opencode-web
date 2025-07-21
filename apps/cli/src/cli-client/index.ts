#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"

import { BROKER_HOST } from "../lib"
import type { Instance } from "../types"
import { ensureBroker } from "../utils"

export async function fetchInstances(brokerPort: number): Promise<{
  instances: Instance[]
} | null> {
  try {
    const res = await fetch(`http://${BROKER_HOST}:${brokerPort}/instances`)
    if (!res.ok) return null
    const data = (await res.json()) as any
    return { instances: (data.instances ?? []) as Instance[] }
  } catch {
    return null
  }
}

export async function stopByInstanceCwd(brokerPort: number, cwd: string) {
  const res = await fetch(`http://${BROKER_HOST}:${brokerPort}/instance`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cwd }),
  })
  if (res.status === 404) {
    console.log(`No instance for ${cwd}`)
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`Failed to stop instance: ${await res.text()}`)
    process.exit(1)
  }
  console.log(`Stopped ${cwd}`)
}

async function handleList() {
  const brokerPort = await ensureBroker()
  const data = await fetchInstances(brokerPort)
  if (!data) {
    console.log("No broker running.")
    return
  }
  const runningInstances = data.instances.filter((i) => i.status === "online")

  if (runningInstances.length === 0) {
    console.log("No instances running.")
    return
  }
  console.log("ID  CWD")
  runningInstances.forEach((inst, idx) => console.log(`${idx}  ${inst.cwd}`))
}

async function handleStop(arg?: string) {
  const brokerPort = await ensureBroker()

  const data = await fetchInstances(brokerPort)
  if (!data) {
    console.log("No instances running.")
    return
  }

  const instances = data.instances.filter((i) => i.status === "online")

  // -all / -a
  if (arg === "-all" || arg === "-a") {
    for (const inst of instances) await stopByInstanceCwd(brokerPort, inst.cwd)
    return
  }

  // No arg -> current directory
  if (!arg) {
    const cwd = path.resolve(process.cwd())
    await stopByInstanceCwd(brokerPort, cwd)
    return
  }

  // numeric id?
  const idNum = Number(arg)
  if (!Number.isNaN(idNum)) {
    const inst = instances[idNum]
    if (!inst) {
      console.log(`No instance with id ${idNum}`)
      process.exit(1)
    }
    await stopByInstanceCwd(brokerPort, inst.cwd)
    return
  }

  // treat as path
  const absPath = path.resolve(arg)
  await stopByInstanceCwd(brokerPort, absPath)
}

async function handleStart(rawPath?: string) {
  let projectDir = path.resolve(process.cwd(), rawPath ?? ".")
  try {
    const stat = fs.statSync(projectDir)
    if (stat.isFile()) projectDir = path.dirname(projectDir)
  } catch {
    console.error(`Path does not exist: ${projectDir}`)
    process.exit(1)
  }

  const brokerPort = await ensureBroker()

  // call start endpoint
  const res = await fetch(`http://${BROKER_HOST}:${brokerPort}/instance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cwd: projectDir }),
  })

  if (res.status === 409) {
    console.log(`Instance already running for ${projectDir}`)
    return
  }

  if (!res.ok) {
    console.error(`Failed to start instance: ${await res.text()}`)
    process.exit(1)
  }

  console.log(`Starting instance for ${projectDir}...`)
}

/*************************
 *  CLI definition via yargs
 *************************/

yargs(hideBin(process.argv))
  .scriptName("opencode-web")
  .command(
    "$0 [path]",
    "Start an instance for the given path (defaults to CWD)",
    (y) =>
      y.positional("path", {
        type: "string",
        describe: "Directory or file to open",
        default: ".",
      }),
    (args) => {
      handleStart(args.path as string | undefined)
    }
  )
  .command(
    "list",
    "List running instances",
    () => {},
    async () => {
      await handleList()
    }
  )
  .command(
    "stop [target]",
    "Stop an instance by current dir, id, path, or -all/-a flag",
    (y) =>
      y
        .positional("target", {
          type: "string",
          describe: "id, path, or -all",
        })
        .option("all", {
          alias: "a",
          type: "boolean",
          describe: "Stop all instances",
        }),
    async (args) => {
      if (args.all) await handleStop("-all")
      else await handleStop(args.target as string | undefined)
    }
  )
  .help()
  .version(false)
  .strict()
  .parse()
