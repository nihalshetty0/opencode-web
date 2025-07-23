import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

interface Props {
  code: string
  lang?: string
  flush?: boolean
}

export function ContentCode(props: Props) {
  const [html, setHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const highlightCode = async () => {
      setIsLoading(true)
      try {
        const result = await codeToHtml(props.code || "", {
          lang: props.lang || "text",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        })
        setHtml(result)
      } catch (error) {
        console.error("Failed to highlight code:", error)
        setHtml(`<pre>${props.code}</pre>`)
      } finally {
        setIsLoading(false)
      }
    }

    highlightCode()
  }, [props.code, props.lang])

  if (isLoading) {
    return (
      <div
        className={`${
          props.flush
            ? "border-0 bg-transparent p-0 rounded-none"
            : "border border-border bg-card rounded px-3 py-2"
        }`}
      >
        <pre className="[--shiki-dark-bg:hsl(var(--muted))!important] bg-muted leading-relaxed text-xs whitespace-pre-wrap break-words">
          {props.code}
        </pre>
      </div>
    )
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={`${
        props.flush
          ? "border-0 bg-transparent p-0 rounded-none"
          : "border border-border bg-card rounded px-3 py-2"
      } [&_pre]:[--shiki-dark-bg:hsl(var(--muted))!important] [&_pre]:bg-muted [&_pre]:leading-relaxed [&_pre]:text-xs [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre_span]:whitespace-pre-wrap`}
    />
  )
}
