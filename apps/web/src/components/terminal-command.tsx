import { Terminal } from "lucide-react"

import { CopyButton } from "@/components/copy-button"

interface TerminalCommandProps {
  command: string
  className?: string
}

export function TerminalCommand({ command, className }: TerminalCommandProps) {
  return (
    <div
      className={`flex items-center gap-2 p-3 bg-muted rounded-md ${className || ""}`}
    >
      <Terminal className="h-4 w-4 text-muted-foreground" />
      <code className="text-sm flex-1">{command}</code>
      <CopyButton text={command} size="sm" />
    </div>
  )
}
