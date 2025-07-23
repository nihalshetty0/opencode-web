import { useEffect } from "react"
import { ChatSidebar } from "@/pages/chat/components/chat-sidebar"
import { ChatWindow } from "@/pages/chat/components/chat-window"
import { OnboardingScreen } from "@/pages/chat/components/onboarding-screen"
import {
  useOpencodeClient,
  useOpencodeClientStore,
} from "@/store/opencode-client"
import { useUserStateStore } from "@/store/user-state"

import { useUrlParams } from "@/hooks/use-url-params"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function ChatLayout() {
  const { port } = useUrlParams()
  const { isFirstTimeUser, markAsReturningUser } = useUserStateStore()
  const setPort = useOpencodeClientStore((state) => state.setPort)

  // Update client when port changes
  useEffect(() => {
    if (port) {
      setPort(port)
      console.log("[ChatLayout] Updated client for port:", port)
    }
  }, [port, setPort])

  // Mark as returning user when first seeing chat UI
  useEffect(() => {
    if (port && isFirstTimeUser) {
      markAsReturningUser()
    }
  }, [port, isFirstTimeUser, markAsReturningUser])

  // Show chat UI if we have a port
  if (port) {
    return (
      <SidebarProvider>
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
