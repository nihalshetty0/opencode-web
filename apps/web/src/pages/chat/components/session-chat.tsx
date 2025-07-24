import { ChatInput } from "@/pages/chat/components/chat-input"
import { Messages } from "@/pages/chat/components/messages"

import { cn } from "@/lib/utils"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

export function SessionChat({ className }: { className?: string }) {
  const {
    data: activeSession,
    isLoading: isActiveSessionLoading,
    isError: isActiveSessionError,
    error: activeSessionError,
  } = useGetActiveSession()

  if (isActiveSessionLoading)
    return <div className="p-6">Loading session...</div>
  if (isActiveSessionError)
    return (
      <div className="p-6 text-red-500">
        {(activeSessionError as Error).message}
      </div>
    )
  // If no active session, we still show the input box so user can start a new chat.

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 w-full max-w-3xl mx-auto",
        className
      )}
    >
      <div className="flex-1 px-6 space-y-2 min-h-0 py-4 overflow-x-hidden">
        <Messages />
      </div>
      <ChatInput key={activeSession?.id ?? "new"} />
    </div>
  )
}
