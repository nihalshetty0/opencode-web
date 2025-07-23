import { useEffect, useRef, useState } from "react"

export function useOverflow<T extends HTMLElement = HTMLElement>() {
  const [hasOverflow, setHasOverflow] = useState(false)
  const elementRef = useRef<T>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (elementRef.current) {
        const hasOverflow =
          elementRef.current.scrollHeight > elementRef.current.clientHeight + 1
        setHasOverflow(hasOverflow)
      }
    }

    const resizeObserver = new ResizeObserver(checkOverflow)
    if (elementRef.current) {
      resizeObserver.observe(elementRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return {
    status: hasOverflow,
    ref: elementRef,
  }
}
