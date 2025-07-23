import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TerminalCommand } from "@/components/terminal-command"

interface AddCodebaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCodebaseDialog({
  open,
  onOpenChange,
}: AddCodebaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Codebase</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Running the opencode-web CLI connects to the codebase in the
              current directory.
            </p>
            <TerminalCommand command="opencode-web" />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Or you can connect to a codebase in a specific directory.
            </p>
            <TerminalCommand command="opencode-web /path/to/project" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
