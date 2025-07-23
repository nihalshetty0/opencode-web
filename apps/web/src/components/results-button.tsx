import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

interface Props {
  children: React.ReactNode
  showCopy?: string
  hideCopy?: string
}

export function ResultsButton(props: Props) {
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setShow(!show)}
      >
        <span>
          {show
            ? props.hideCopy || "Hide results"
            : props.showCopy || "Show results"}
        </span>
        <span className="flex items-center">
          {show ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : (
            <ChevronRightIcon className="h-3 w-3" />
          )}
        </span>
      </button>
      {show && <div className="mt-2">{props.children}</div>}
    </>
  )
}
