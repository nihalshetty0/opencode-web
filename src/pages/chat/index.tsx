import { ChatSidebar } from "@/pages/chat/components/chat-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatWindow } from "@/pages/chat/components/chat-window";

export function ChatLayout() {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset className="border-b">
        <ChatWindow />
      </SidebarInset>
    </SidebarProvider>
  );
}
