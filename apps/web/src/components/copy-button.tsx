import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { copyToClipboard } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  text: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  children?: React.ReactNode
}

export function CopyButton({
  text,
  className,
  variant = "outline",
  size = "default",
  children,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("gap-2", className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {children || "Copy"}
        </>
      )}
    </Button>
  )
}
