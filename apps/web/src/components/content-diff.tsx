import { useMemo } from "react"
import { parsePatch } from "diff"

import { ContentCode } from "./content-code"

type DiffRow = {
  left: string
  right: string
  type: "added" | "removed" | "unchanged" | "modified"
}

interface Props {
  diff: string
  lang?: string
}

export function ContentDiff(props: Props) {
  const rows = useMemo(() => {
    const diffRows: DiffRow[] = []

    try {
      const patches = parsePatch(props.diff)

      for (const patch of patches) {
        for (const hunk of patch.hunks) {
          const lines = hunk.lines
          let i = 0

          while (i < lines.length) {
            const line = lines[i]
            const content = line.slice(1)
            const prefix = line[0]

            if (prefix === "-") {
              // Look ahead for consecutive additions to pair with removals
              const removals: string[] = [content]
              let j = i + 1

              // Collect all consecutive removals
              while (j < lines.length && lines[j][0] === "-") {
                removals.push(lines[j].slice(1))
                j++
              }

              // Collect all consecutive additions that follow
              const additions: string[] = []
              while (j < lines.length && lines[j][0] === "+") {
                additions.push(lines[j].slice(1))
                j++
              }

              // Pair removals with additions
              const maxLength = Math.max(removals.length, additions.length)
              for (let k = 0; k < maxLength; k++) {
                const hasLeft = k < removals.length
                const hasRight = k < additions.length

                if (hasLeft && hasRight) {
                  // Replacement - left is removed, right is added
                  diffRows.push({
                    left: removals[k],
                    right: additions[k],
                    type: "modified",
                  })
                } else if (hasLeft) {
                  // Pure removal
                  diffRows.push({
                    left: removals[k],
                    right: "",
                    type: "removed",
                  })
                } else if (hasRight) {
                  // Pure addition - only create if we actually have content
                  diffRows.push({
                    left: "",
                    right: additions[k],
                    type: "added",
                  })
                }
              }

              i = j
            } else if (prefix === "+") {
              // Standalone addition (not paired with removal)
              diffRows.push({
                left: "",
                right: content,
                type: "added",
              })
              i++
            } else if (prefix === " ") {
              diffRows.push({
                left: content === "" ? " " : content,
                right: content === "" ? " " : content,
                type: "unchanged",
              })
              i++
            } else {
              i++
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse patch:", error)
      return []
    }

    return diffRows
  }, [props.diff])

  const mobileRows = useMemo(() => {
    const mobileBlocks: {
      type: "removed" | "added" | "unchanged"
      lines: string[]
    }[] = []
    const currentRows = rows

    let i = 0
    while (i < currentRows.length) {
      const removedLines: string[] = []
      const addedLines: string[] = []

      // Collect consecutive modified/removed/added rows
      while (
        i < currentRows.length &&
        (currentRows[i].type === "modified" ||
          currentRows[i].type === "removed" ||
          currentRows[i].type === "added")
      ) {
        const row = currentRows[i]
        if (row.left && (row.type === "removed" || row.type === "modified")) {
          removedLines.push(row.left)
        }
        if (row.right && (row.type === "added" || row.type === "modified")) {
          addedLines.push(row.right)
        }
        i++
      }

      // Add grouped blocks
      if (removedLines.length > 0) {
        mobileBlocks.push({ type: "removed", lines: removedLines })
      }
      if (addedLines.length > 0) {
        mobileBlocks.push({ type: "added", lines: addedLines })
      }

      // Add unchanged rows as-is
      if (i < currentRows.length && currentRows[i].type === "unchanged") {
        mobileBlocks.push({
          type: "unchanged",
          lines: [currentRows[i].left],
        })
        i++
      }
    }

    return mobileBlocks
  }, [rows])

  return (
    <div className="flex flex-col border border-border bg-card rounded">
      {/* Desktop view */}
      <div className="hidden @md/chat:block">
        {rows.map((r, index) => (
          <div key={index} className="grid grid-cols-2 items-stretch">
            <div
              className={`relative flex flex-col overflow-x-visible min-w-0 items-stretch px-4 py-0 pl-9 border-r border-border ${
                r.type === "removed" || r.type === "modified"
                  ? "bg-destructive/10"
                  : ""
              } ${index === 0 ? "pt-1" : ""} ${index === rows.length - 1 ? "pb-1" : ""} before:absolute before:left-2 before:top-px before:select-none ${
                r.type === "removed" || r.type === "modified"
                  ? "before:content-['-'] before:text-destructive"
                  : ""
              }`}
            >
              <ContentCode code={r.left} flush lang={props.lang} />
            </div>
            <div
              className={`relative flex flex-col overflow-x-visible min-w-0 items-stretch px-4 py-0 pl-9 ${
                r.type === "added" || r.type === "modified"
                  ? "bg-green-500/10"
                  : ""
              } ${index === 0 ? "pt-1" : ""} ${index === rows.length - 1 ? "pb-1" : ""} before:absolute before:left-2 before:top-px before:select-none ${
                r.type === "added" || r.type === "modified"
                  ? "before:content-['+'] before:text-green-600"
                  : ""
              }`}
            >
              <ContentCode code={r.right} lang={props.lang} flush />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile view */}
      <div className="block @md/chat:hidden">
        {mobileRows.map((block, blockIndex) => (
          <div key={blockIndex} className="flex flex-col">
            {block.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={`relative px-4 py-0 pl-9 ${
                  blockIndex === 0 && lineIndex === 0 ? "pt-1" : ""
                } ${
                  blockIndex === mobileRows.length - 1 &&
                  lineIndex === block.lines.length - 1
                    ? "pb-1"
                    : ""
                } before:absolute before:left-2 before:top-px before:select-none ${
                  block.type === "removed"
                    ? "bg-destructive/10 before:content-['-'] before:text-destructive"
                    : block.type === "added"
                      ? "bg-green-500/10 before:content-['+'] before:text-green-600"
                      : ""
                }`}
              >
                <ContentCode code={line} lang={props.lang} flush />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
