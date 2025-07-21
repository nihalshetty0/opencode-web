import { Play } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TerminalCommand } from "@/components/terminal-command"

export function StartInstanceGuide() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          <CardTitle>Connect to a Codebase</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Running the opencode-web CLI connects to the codebase in the current
            directory.
          </p>
          <TerminalCommand command="opencode-web" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Or you can connect to a codebase in a specific directory.
          </p>
          <TerminalCommand command="opencode-web /path/to/project" />
        </div>
      </CardContent>
    </Card>
  )
}
