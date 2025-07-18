import { SessionChat } from "@/pages/chat/components/session-chat"

import { useGetAppInfo } from "@/hooks/fetch/app"
import { useGetActiveSession } from "@/hooks/fetch/sessions"
import { useHandleSessionMessageEvents } from "@/hooks/use-handle-session-message-events"

export function ChatWindow() {
  useHandleSessionMessageEvents()
  return (
    <>
      <ChatHeader />
      <SessionChat />
    </>
  )
}

const ChatHeader = () => {
  const { data: activeSession } = useGetActiveSession()
  const { data: appInfo } = useGetAppInfo()
  return (
    <header className="flex h-16 shrink-0 items-center bg-background gap-2 border-b px-4 justify-center sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {appInfo?.projectName ?? appInfo?.path.root}
        </span>
        <span>/</span>
        <span>{activeSession?.title}</span>
      </div>
    </header>
  )
}
