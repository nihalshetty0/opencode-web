import { useSearchParams } from "react-router-dom"

export interface UrlParams {
  cwd: string | null
  sessionId: string | null
}

export function useUrlParams(): UrlParams {
  const [searchParams] = useSearchParams()

  return {
    cwd: searchParams.get("cwd"),
    sessionId: searchParams.get("session"),
  }
}
