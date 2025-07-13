import { ChatSidebar } from "@/pages/chat/components/chat-sidebar"
import { ChatWindow } from "@/pages/chat/components/chat-window"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function ChatLayout() {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset className="border-b">
        <ChatWindow />
      </SidebarInset>
    </SidebarProvider>
  )
}
