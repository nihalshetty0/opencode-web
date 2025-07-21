import { useState } from "react"
import { useUserStateStore } from "@/store/user-state"

import { InstallGuide } from "./install-guide"
import { InstanceLists } from "./instance-lists"
import { StartInstanceGuide } from "./start-instance-guide"

export function OnboardingScreen() {
  const { isFirstTimeUser } = useUserStateStore()
  const [isInstallCollapsed, setIsInstallCollapsed] = useState(!isFirstTimeUser)

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Opencode Web</h1>
          <p className="text-muted-foreground">
            Chat with AI about your code, locally and securely.
          </p>
        </div>

        {/* Install Guide - collapsed for returning users */}
        <InstallGuide
          isCollapsed={isInstallCollapsed}
          onToggle={() => setIsInstallCollapsed(!isInstallCollapsed)}
        />

        {/* Start Instance Guide - always visible */}
        <StartInstanceGuide />

        {/* Instance Lists - only if there are instances to show */}
        <InstanceLists />
      </div>
    </div>
  )
}
