import { ChevronDown, ChevronRight, Terminal } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CopyButton } from "@/components/copy-button"
import { TerminalCommand } from "@/components/terminal-command"

interface InstallGuideProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function InstallGuide({ isCollapsed, onToggle }: InstallGuideProps) {
  const installCommand =
    "curl -sSL https://opencode-web.vercel.app/install.sh | bash"

  return (
    <Card>
      <Collapsible open={!isCollapsed} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:text-foreground select-none">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <CardTitle>Install Opencode CLI</CardTitle>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Install the Opencode CLI tool to start chatting with AI about
                your code.
              </p>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm flex-1">{installCommand}</code>
                <CopyButton text={installCommand} size="sm" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">What happens next?</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Install the CLI tool on your machine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Run the command below to connect to your codebase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Start chatting with AI about your code</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
