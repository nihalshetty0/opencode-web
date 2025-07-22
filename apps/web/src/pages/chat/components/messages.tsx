// Import OpenAPI types for Message and Part
import { useEffect, useMemo, useState } from "react"
import type {
  AssistantMessageWithParts,
  MessageWithParts,
  ToolPartWithCompletedTool,
} from "@/types"
import type { Opencode } from "@opencode-ai/sdk"
import map from "lang-map"
import { codeToHtml } from "shiki"
import type { Diagnostic } from "vscode-languageserver-types"

import { StickToBottom, StickToBottomContent } from "@/lib/use-stick-to-bottom"
import { cn } from "@/lib/utils"
import { useGetMessages } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

import { Card } from "@/components/ui/card"

// import { ContentDiff } from "@/components/content-diff"

export function Messages() {
  const { data: activeSession } = useGetActiveSession()
  const { data: messages } = useGetMessages({ sessionId: activeSession?.id })

  return (
    <StickToBottom scrollMode="document">
      <StickToBottomContent>
        {messages && messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((message: MessageWithParts) => (
              <Message key={message.info.id} message={message} />
            ))}
          </div>
        )}
      </StickToBottomContent>
    </StickToBottom>
  )
}

function Message({ message }: { message: MessageWithParts }) {
  // if just info, return null
  if (!message.parts || message.parts.length === 0) {
    return null
  }

  return (
    <>
      {message.parts.map((part: Opencode.Part) => {
        return <Part key={part.id} part={part} message={message} />
      })}
    </>
  )
}

function Part({
  part,
  message,
}: {
  part: Opencode.Part
  message: MessageWithParts
}) {
  switch (part.type) {
    case "text":
      return <TextPart part={part} message={message} />
    case "tool":
      return <ToolPart part={part} message={message} />
    default:
      return null
  }
}

function TextPart({
  part,
  message,
}: {
  part: Opencode.Part
  message: MessageWithParts
}) {
  if (part.type !== "text") {
    return null
  }

  return (
    <Card
      key={part.id}
      className={cn(
        "p-3 border-0",
        message.info.role === "user"
          ? "border-l-4 border-l-blue-500"
          : "border-r-4 border-r-purple-500"
      )}
    >
      <div className="text-sm whitespace-pre-line">{part.text}</div>
    </Card>
  )
}

function isCompletedToolPart(
  part: Opencode.Part
): part is ToolPartWithCompletedTool {
  return part.type === "tool" && part.state?.status === "completed"
}

function isAssistantMessage(
  message: MessageWithParts
): message is AssistantMessageWithParts {
  return message.info.role === "assistant"
}

function ToolPart({
  part,
  message,
}: {
  part: Opencode.Part
  message: MessageWithParts
}) {
  if (part.type !== "tool") {
    return null
  }

  // Handle error state
  if (part.state?.status === "error") {
    return (
      <div className="bg-red-100 text-red-700 p-2 rounded">
        <strong>Error:</strong> {part.state.error}
      </div>
    )
  }

  // Handle completed state
  if (isCompletedToolPart(part) && isAssistantMessage(message)) {
    return <CompletedToolPart part={part} message={message} />
  }

  // Optionally handle "pending" or "running" states
  return null
}

const CompletedToolPart = ({
  part,
  message,
}: {
  part: ToolPartWithCompletedTool
  message: AssistantMessageWithParts
}) => {
  switch (part.tool) {
    case "bash":
      return <BashToolComponent part={part} />
    case "edit":
      return <div>EDIT: lskjdl</div>
    // return <EditToolComponent part={part} message={message} />
    default:
      return <FallbackToolComponent part={part} />
  }
}

const FallbackToolComponent = ({ part }: { part: Opencode.Part }) => {
  if (part.type !== "tool") return null

  return <div>{part.tool}</div>
}

// TODO: need better way to render this
const BashToolComponent = ({
  part,
}: {
  part: Opencode.Part & { type: "tool"; state: Opencode.ToolStateCompleted }
}) => {
  const command = (part.state?.input?.command || "") as string
  const stdout = (part.state?.metadata?.stdout || "") as string

  const [commandHtml, setCommandHtml] = useState<string>("")
  const [outputHtml, setOutputHtml] = useState<string>("")

  // TODO: need to sync shiki theme with the theme of the app
  useEffect(() => {
    if (command) {
      codeToHtml("> " + command, {
        lang: "bash",
        theme: "github-dark",
      }).then(setCommandHtml)
    } else {
      setCommandHtml("")
    }
  }, [command])

  useEffect(() => {
    if (stdout) {
      codeToHtml(stdout, {
        lang: "bash",
        theme: "github-dark",
      }).then(setOutputHtml)
    } else {
      setOutputHtml("")
    }
  }, [stdout])

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground">
        <span>BASH </span>

        {(part.state?.input?.description || "") as string}
      </div>
      <div className="">
        <div
          className="[&>pre]:p-2 [&>pre]:pb-0"
          dangerouslySetInnerHTML={{ __html: commandHtml }}
        />
        <div
          className="[&>pre]:p-2 [&>pre]:pt-0"
          dangerouslySetInnerHTML={{ __html: outputHtml }}
        />
      </div>
    </div>
  )
}

function getShikiLang(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const langs = map.languages(ext)
  const type = langs?.[0]?.toLowerCase()

  const overrides: Record<string, string> = {
    conf: "shellscript",
  }

  return type ? (overrides[type] ?? type) : "plaintext"
}

function stripWorkingDirectory(filePath?: string, workingDir?: string) {
  if (filePath === undefined || workingDir === undefined) return filePath

  const prefix = workingDir.endsWith("/") ? workingDir : workingDir + "/"

  if (filePath === workingDir) {
    return ""
  }

  if (filePath.startsWith(prefix)) {
    return filePath.slice(prefix.length)
  }

  return filePath
}

function getDiagnostics(
  diagnosticsByFile: Record<string, Diagnostic[]>,
  currentFile: string
): React.ReactElement[] {
  const result: React.ReactElement[] = []

  if (
    diagnosticsByFile === undefined ||
    diagnosticsByFile[currentFile] === undefined
  )
    return result

  for (const diags of Object.values(diagnosticsByFile)) {
    for (const d of diags) {
      if (d.severity !== 1) continue

      const line = d.range.start.line + 1
      const column = d.range.start.character + 1

      result.push(
        <pre>
          <span data-color="red" data-marker="label">
            Error
          </span>
          <span data-color="dimmed" data-separator>
            [{line}:{column}]
          </span>
          <span>{d.message}</span>
        </pre>
      )
    }
  }

  return result
}

const EditToolComponent = ({
  message,
  part,
}: {
  message: AssistantMessageWithParts
  part: Opencode.Part & { type: "tool"; state: Opencode.ToolStateCompleted }
}) => {
  const filePath = useMemo(
    () =>
      stripWorkingDirectory(
        (part.state.input.filePath ?? "") as string,
        message.info.path.cwd
      ),
    [part.state.input.filePath, message.info.path.cwd]
  )

  return (
    <>
      <div>EDIT: lskjdl</div>
      {/* <ContentDiff
        diff={(part.state.metadata?.diff || "") as string}
        lang={getShikiLang(filePath || "")}
      /> */}
    </>
  )
}
