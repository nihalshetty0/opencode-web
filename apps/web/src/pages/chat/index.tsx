import { useEffect } from "react"
import { ChatSidebar } from "@/pages/chat/components/chat-sidebar"
import { ChatWindow } from "@/pages/chat/components/chat-window"
import { OnboardingScreen } from "@/pages/chat/components/onboarding-screen"
import { useUserStateStore } from "@/store/user-state"

import { useGetInstances } from "@/hooks/fetch/broker"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export function ChatLayout() {
  const { data: brokerData, isPending } = useGetInstances()
  const { isFirstTimeUser, markAsReturningUser } = useUserStateStore()

  const instances = brokerData?.instances || []
  const onlineInstances = instances.filter((i) => i.status === "online")

  // Mark as returning user when first seeing chat UI
  useEffect(() => {
    if (onlineInstances.length > 0 && isFirstTimeUser) {
      markAsReturningUser()
    }
  }, [onlineInstances.length, isFirstTimeUser, markAsReturningUser])

  // Loading state - only show on initial load, not background refetches
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Show chat UI if there are online instances
  if (onlineInstances.length > 0) {
    return (
      <SidebarProvider>
        <ChatSidebar />
        <SidebarInset>
          <ChatWindow />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show onboarding screen if no online instances (broker offline or online but no instances)
  return <OnboardingScreen />
}
