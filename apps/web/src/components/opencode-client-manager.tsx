import { useEffect, useMemo } from "react"
import { useOpencodeClientStore } from "@/store/opencode-client"
import { useSearchParams } from "react-router-dom"

import { useGetInstances } from "@/hooks/fetch/broker"
import { useUrlParams } from "@/hooks/use-url-params"

/**
 * Manager component that syncs broker data with Opencode client store
 * Place this once at the app root - it has no UI, just side effects
 */
export function OpencodeClientManager() {
  const { data: brokerData } = useGetInstances()
  const { cwd: cwdFromUrl } = useUrlParams()
  const { createClient, removeClient, clearAllClients } =
    useOpencodeClientStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const instances = brokerData?.instances || []
  const onlineInstances = instances.filter((inst) => inst.status === "online")

  // Determine what the current cwd should be
  const currentCwd = useMemo(() => {
    // If URL has cwd, use that (even if offline)
    if (cwdFromUrl) {
      return cwdFromUrl
    }

    // No URL cwd - default to first online instance
    if (onlineInstances.length > 0) {
      return onlineInstances[0].cwd
    }

    return null
  }, [cwdFromUrl, onlineInstances])

  // Create clients for all online instances
  useEffect(() => {
    onlineInstances.forEach((instance) => {
      createClient(instance.cwd, instance.port)
    })
  }, [onlineInstances, createClient])

  // If the cwd in URL is no longer online, switch to first online or remove param
  useEffect(() => {
    if (!cwdFromUrl) return

    const isCurrentOnline = onlineInstances.some(
      (inst) => inst.cwd === cwdFromUrl && inst.status === "online"
    )

    if (isCurrentOnline) return // still valid

    const newParams = new URLSearchParams(searchParams)

    if (onlineInstances.length > 0) {
      // Switch to first online instance
      newParams.set("cwd", onlineInstances[0].cwd)
    } else {
      // No online instances, remove the param
      newParams.delete("cwd")
    }

    setSearchParams(newParams, { replace: true })
  }, [cwdFromUrl, onlineInstances, searchParams, setSearchParams])

  // Cleanup clients for instances that are no longer available
  useEffect(() => {
    const availableCwds = new Set(instances.map((inst) => inst.cwd))
    const { clients } = useOpencodeClientStore.getState()

    // Remove clients for cwds that no longer exist
    Object.keys(clients).forEach((cwd) => {
      if (!availableCwds.has(cwd)) {
        removeClient(cwd)
      }
    })
  }, [instances, removeClient])

  // Clear all clients when broker is offline
  useEffect(() => {
    if (brokerData?.brokerStatus === "offline") {
      clearAllClients()
    }
  }, [brokerData?.brokerStatus, clearAllClients])

  // If no cwd param but we have a currentCwd (default), push it to URL
  useEffect(() => {
    if (!cwdFromUrl && currentCwd) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set("cwd", currentCwd)
      setSearchParams(newParams, { replace: true })
    }
  }, [cwdFromUrl, currentCwd, searchParams, setSearchParams])

  // This component renders nothing
  return null
}
