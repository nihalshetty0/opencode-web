import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

import { useOverflow } from "@/hooks/use-overflow"

interface Props {
  command: string
  output: string
  description?: string
  expand?: boolean
}

export function ContentBash(props: Props) {
  const [expanded, setExpanded] = useState(false)
  const [commandHtml, setCommandHtml] = useState("")
  const [outputHtml, setOutputHtml] = useState("")
  const overflow = useOverflow<HTMLDivElement>()

  // Generate syntax highlighted HTML for command and output
  useEffect(() => {
    const generateHtml = async () => {
      try {
        const commandResult = await codeToHtml(props.command || "", {
          lang: "bash",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        })
        setCommandHtml(commandResult)

        const outputResult = await codeToHtml(props.output || "", {
          lang: "console",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        })
        setOutputHtml(outputResult)
      } catch (error) {
        console.error("Failed to highlight bash code:", error)
        setCommandHtml(props.command || "")
        setOutputHtml(props.output || "")
      }
    }

    generateHtml()
  }, [props.command, props.output])

  const shouldShowButton = !props.expand && overflow.status

  return (
    <div className="flex flex-col border border-border bg-card rounded">
      {/* Description */}
      {props.description && (
        <div className="text-sm text-muted-foreground p-2 py-1">
          {props.description}
        </div>
      )}

      {/* Command */}
      <div
        className="[--shiki-dark-bg:hsl(var(--card))!important] bg-card leading-relaxed text-xs whitespace-pre-wrap break-words [&_pre]:p-2 [&_pre]:pb-0"
        dangerouslySetInnerHTML={{ __html: commandHtml }}
      />

      {/* Output */}
      <div
        ref={overflow.ref}
        className={`[--shiki-dark-bg:hsl(var(--card))!important] bg-card leading-relaxed text-xs whitespace-pre-wrap break-words [&_pre]:p-2 [&_pre]:pt-0 ${
          expanded || props.expand ? "block" : "line-clamp-10 overflow-hidden"
        }`}
        dangerouslySetInnerHTML={{ __html: outputHtml }}
      />

      {/* Expand button */}
      {shouldShowButton && (
        <button
          type="button"
          className="flex-none py-0.5 text-xs px-2 pb-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
