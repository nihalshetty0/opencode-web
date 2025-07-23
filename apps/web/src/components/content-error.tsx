import { useState } from "react"

import { useOverflow } from "@/hooks/use-overflow"

interface Props {
  children: React.ReactNode
  expand?: boolean
}

export function ContentError(props: Props) {
  const [expanded, setExpanded] = useState(false)
  const overflow = useOverflow<HTMLDivElement>()

  const shouldShowButton = (!props.expand && overflow.status) || expanded

  return (
    <div className="flex flex-col items-start gap-4 self-start bg-muted rounded p-2">
      <div
        ref={overflow.ref}
        className={`${
          expanded || props.expand ? "block" : "line-clamp-7 overflow-hidden"
        }`}
      >
        {props.children}
      </div>
      {shouldShowButton && (
        <button
          type="button"
          className="flex-none py-0.5 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

export function formatErrorString(error: string): React.ReactElement {
  const errorMarker = "Error: "
  const startsWithError = error.startsWith(errorMarker)

  return startsWithError ? (
    <pre className="mb-2 leading-relaxed text-xs whitespace-pre-wrap break-words last:mb-0">
      <span className="mr-1 text-destructive uppercase tracking-tighter">
        Error
      </span>
      <span>{error.slice(errorMarker.length)}</span>
    </pre>
  ) : (
    <pre className="mb-2 leading-relaxed text-xs whitespace-pre-wrap break-words last:mb-0 text-muted-foreground">
      <span>{error}</span>
    </pre>
  )
}
