import { useSearchParams } from "react-router-dom"

export interface UrlParams {
  port: number | null
  sessionId: string | null
}

export function useUrlParams(): UrlParams {
  const [searchParams] = useSearchParams()
  const portParam = searchParams.get("port")
  const sessionParam = searchParams.get("session")

  const result = {
    port: portParam ? parseInt(portParam, 10) : null,
    sessionId: sessionParam,
  }

  return result
}
