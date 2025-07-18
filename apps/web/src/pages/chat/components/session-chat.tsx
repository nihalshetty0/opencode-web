import { ChatInput } from "@/pages/chat/components/chat-input"
import { Messages } from "@/pages/chat/components/messages"

import { cn } from "@/lib/utils"
import { useGetMessages } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

import { Skeleton } from "@/components/ui/skeleton"

export function SessionChat({ className }: { className?: string }) {
  const {
    data: activeSession,
    isLoading: isActiveSessionLoading,
    isError: isActiveSessionError,
    error: activeSessionError,
  } = useGetActiveSession()

  const {
    data: messages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
  } = useGetMessages({ sessionId: activeSession?.id })

  if (isActiveSessionLoading)
    return <div className="p-6">Loading session...</div>
  if (isActiveSessionError)
    return (
      <div className="p-6 text-red-500">
        {(activeSessionError as Error).message}
      </div>
    )
  if (!activeSession) return <div className="p-6">Session not found.</div>

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 w-full max-w-3xl mx-auto",
        className
      )}
    >
      <div className="flex-1 px-6 space-y-2 min-h-0 py-4 overflow-x-hidden">
        {isMessagesLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {isMessagesError && (
          <div className="text-red-500">{(messagesError as Error).message}</div>
        )}
        {messages && messages.length === 0 && <div>No messages found.</div>}

        <Messages />
      </div>
      <ChatInput />
    </div>
  )
}
