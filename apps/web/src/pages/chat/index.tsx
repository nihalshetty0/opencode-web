import { useEffect } from "react"
import { ChatSidebar } from "@/pages/chat/components/chat-sidebar"
import { ChatWindow } from "@/pages/chat/components/chat-window"
import { OnboardingScreen } from "@/pages/chat/components/onboarding-screen"
import { useOpencodeClientStore } from "@/store/opencode-client"
import { useBusySessionStore } from "@/store/use-busy-session-store"
import { useUserStateStore } from "@/store/user-state"

import { useUrlParams } from "@/hooks/use-url-params"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function ChatLayout() {
  const { port } = useUrlParams()

  // Show chat UI if we have a port
  if (port) {
    return (
      <SidebarProvider>
        <MarkIfUserFirstTime />
        <InitOpencodeClientForPort />
        <InitSubscribeToBusySessions />

        <ChatSidebar />
        <SidebarInset className="@container/chat">
          <ChatWindow />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show onboarding for no port
  return <OnboardingScreen />
}

const MarkIfUserFirstTime = () => {
  const { isFirstTimeUser, markAsReturningUser } = useUserStateStore()

  const { port } = useUrlParams()

  // Mark as returning user when first seeing chat UI
  useEffect(() => {
    if (port && isFirstTimeUser) {
      markAsReturningUser()
    }
  }, [isFirstTimeUser, markAsReturningUser, port])

  return null
}

const InitOpencodeClientForPort = () => {
  const { port } = useUrlParams()
  const setPort = useOpencodeClientStore((state) => state.setPort)

  // Update client when port changes
  useEffect(() => {
    if (port) {
      setPort(port)
    }
  }, [port, setPort])

  return null
}

const InitSubscribeToBusySessions = () => {
  const { port } = useUrlParams()

  const { init: initBusySessionStore, cleanup: cleanupBusySessionState } =
    useBusySessionStore()

  useEffect(() => {
    initBusySessionStore()
    return () => cleanupBusySessionState()
  }, [initBusySessionStore, cleanupBusySessionState, port])

  return null
}
