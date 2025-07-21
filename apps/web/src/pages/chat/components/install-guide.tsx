import { ChevronDown, ChevronRight, Download, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CopyButton } from "@/components/copy-button"

interface InstallGuideProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function InstallGuide({ isCollapsed, onToggle }: InstallGuideProps) {
  const installCommand =
    "curl -sSL https://opencode-web.vercel.app/install.sh | bash"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle>Install Opencode CLI</CardTitle>
          </div>
          {isCollapsed && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              Show install instructions
            </Button>
          )}
        </div>
      </CardHeader>

      <Collapsible open={!isCollapsed} onOpenChange={onToggle}>
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

            <div className="space-y-2">
              <h4 className="font-medium">FAQ</h4>
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-foreground">
                  What is Opencode?
                </summary>
                <p className="mt-2 text-muted-foreground">
                  Opencode is an AI coding agent that runs locally on your
                  machine. It analyzes your codebase and provides intelligent
                  responses to help you code faster.
                </p>
              </details>

              <details className="text-sm">
                <summary className="cursor-pointer hover:text-foreground">
                  Is my code sent to external servers?
                </summary>
                <p className="mt-2 text-muted-foreground">
                  No, all code analysis happens locally on your machine. Your
                  code never leaves your computer.
                </p>
              </details>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
