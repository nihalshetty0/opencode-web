import { useEffect, useState } from "react"
import { transformerNotationDiff } from "@shikijs/transformers"
import style from "@styles/content-code.module.css"
import { bundledLanguages, codeToHtml } from "shiki"

interface Props {
  code: string
  lang?: string
  flush?: boolean
}

export function ContentCode(props: Props) {
  const [html, setHtml] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    async function run() {
      const result = await codeToHtml(props.code || "", {
        lang:
          props.lang && props.lang in bundledLanguages ? props.lang : "text",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        transformers: [transformerNotationDiff()],
      })
      if (!cancelled) setHtml(result as string)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [props.code, props.lang])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={style.root}
      data-flush={props.flush === true ? true : undefined}
    />
  )
}
