import { useEffect, useState } from "react"
import { marked } from "marked"
import markedShiki from "marked-shiki"
import { codeToHtml } from "shiki"

import { useOverflow } from "@/hooks/use-overflow"

interface Props {
  text: string
  expand?: boolean
  highlight?: boolean
}

const markedWithShiki = marked.use(
  markedShiki({
    highlight(code: string, lang: string) {
      return codeToHtml(code, {
        lang: lang || "text",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
      })
    },
  })
)

export function ContentMarkdown(props: Props) {
  const [html, setHtml] = useState("")
  const [expanded, setExpanded] = useState(false)
  const overflow = useOverflow<HTMLDivElement>()

  useEffect(() => {
    const generateHtml = async () => {
      try {
        const strippedText = strip(props.text)
        const result = await markedWithShiki.parse(strippedText)
        setHtml(result)
      } catch (error) {
        console.error("Failed to parse markdown:", error)
        setHtml(props.text)
      }
    }

    generateHtml()
  }, [props.text])

  const shouldShowButton = !props.expand && overflow.status

  return (
    <div className="flex flex-col items-start gap-4">
      <div
        ref={overflow.ref}
        className={`prose prose-sm max-w-none ${
          expanded || props.expand ? "block" : "line-clamp-3 overflow-hidden"
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

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

function strip(text: string): string {
  const wrappedRe = /^\s*<([A-Za-z]\w*)>\s*([\s\S]*?)\s*<\/\1>\s*$/
  const match = text.match(wrappedRe)
  return match ? match[2] : text
}
