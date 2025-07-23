import { useState } from "react"

import { useOverflow } from "@/hooks/use-overflow"

interface Props {
  text: string
  expand?: boolean
  compact?: boolean
}

export function ContentText(props: Props) {
  const [expanded, setExpanded] = useState(false)
  const overflow = useOverflow<HTMLPreElement>()

  const shouldShowButton = (!props.expand && overflow.status) || expanded

  return (
    <div
      className={`flex flex-col items-start gap-4 self-start text-sm ${
        props.compact ? "text-xs text-foreground" : "text-foreground"
      } bg-card border rounded px-3 py-2 pr-5`}
    >
      <pre
        ref={overflow.ref}
        className={`leading-relaxed whitespace-pre-wrap break-words ${
          expanded || props.expand ? "block" : "line-clamp-3 overflow-hidden"
        }`}
      >
        {props.text}
      </pre>
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
