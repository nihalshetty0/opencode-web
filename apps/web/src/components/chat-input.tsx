// Ref: https://www.kibo-ui.com/components/ai-input
import type { ComponentProps, KeyboardEventHandler } from "react"
import { memo, useCallback, useEffect, useRef } from "react"
import { Loader2Icon, SendIcon, SquareIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type UseAutoResizeTextareaProps = {
  minHeight: number
  maxHeight?: number
}

const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) {
        return
      }

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

export type ChatInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number
  maxHeight?: number
}

const ChatInputTextareaComponent = ({
  onChange,
  className,
  placeholder = "What would you like to do?",
  minHeight = 48,
  maxHeight = 164,
  ...props
}: ChatInputTextareaProps) => {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  })

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <Textarea
      className={cn(
        "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
        "bg-transparent dark:bg-transparent",
        "focus-visible:ring-0",
        className
      )}
      name="message"
      onChange={(e) => {
        adjustHeight()
        onChange?.(e)
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      ref={textareaRef}
      {...props}
    />
  )
}

export const ChatInputTextarea = memo(ChatInputTextareaComponent)

export type ChatInputSubmitProps = ComponentProps<typeof Button> & {
  status?: "submitted" | "streaming" | "ready" | "error"
}

const ChatInputSubmitComponent = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}: ChatInputSubmitProps) => {
  let Icon = <SendIcon />

  if (status === "submitted") {
    Icon = <Loader2Icon className="animate-spin" />
  } else if (status === "streaming") {
    Icon = <SquareIcon />
  } else if (status === "error") {
    Icon = <XIcon />
  }

  return (
    <Button
      className={cn("gap-1.5 rounded-lg rounded-br-xl", className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  )
}

export const ChatInputSubmit = memo(ChatInputSubmitComponent)
