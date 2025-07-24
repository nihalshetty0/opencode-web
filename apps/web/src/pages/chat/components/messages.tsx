import { memo, useMemo } from "react"
import type {
  AssistantMessageWithParts,
  MessageWithParts,
  ToolPartWithCompletedTool,
} from "@/types"
import type { Opencode } from "@opencode-ai/sdk"
import map from "lang-map"

import { cn, isAssistantMessage, isCompletedToolPart } from "@/lib/utils"
import { useGetMessages } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

import { Card } from "@/components/ui/card"
import { Markdown } from "@/components/ui/markdown"
import { Skeleton } from "@/components/ui/skeleton"
import { ContentBash } from "@/components/content-bash"
import { ContentCode } from "@/components/content-code"
import { ContentDiff } from "@/components/content-diff"
import { ContentError, formatErrorString } from "@/components/content-error"
import { ContentMarkdown } from "@/components/content-markdown"
import { ContentText } from "@/components/content-text"
import { ResultsButton } from "@/components/results-button"

interface Todo {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
}

function MessagesComponent() {
  const { data: activeSession } = useGetActiveSession()
  const {
    data: messages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
  } = useGetMessages({ sessionId: activeSession?.id })

  return (
    // <StickToBottom scrollMode="document">
    //   <StickToBottomContent>
    <>
      {isMessagesLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {isMessagesError && (
        <div className="text-red-500">{(messagesError as Error).message}</div>
      )}
      {activeSession && messages && messages.length === 0 && (
        <div>No messages found.</div>
      )}

      {messages && messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((message: MessageWithParts) => (
            <Message key={message.info.id} message={message} />
          ))}
        </div>
      )}

      {/* </StickToBottomContent>
    </StickToBottom> */}
    </>
  )
}

export const Messages = memo(MessagesComponent)

function MessageComponent({ message }: { message: MessageWithParts }) {
  if (message.info.id === "msg_83a799247001VCi3MbOtCASnsE") {
    console.log("message", message)
  }

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

const Message = memo(MessageComponent)

function PartComponent({
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

const Part = memo(PartComponent)

function TextPartComponent({
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
        "p-3 border-0 prose dark:prose-invert max-w-none",
        message.info.role === "user"
          ? "border-l-4 border-l-blue-500"
          : "border-r-4 border-r-purple-500"
      )}
    >
      <Markdown className="">{part.text}</Markdown>
    </Card>
  )
}

const TextPart = memo(TextPartComponent)

function ToolPartComponent({
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

const ToolPart = memo(ToolPartComponent)

const CompletedToolPartComponent = ({
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
      return <EditToolComponent part={part} message={message} />
    case "read":
      return <ReadToolComponent part={part} message={message} />
    case "glob":
      return <GlobToolComponent part={part} />
    case "write":
      return <WriteToolComponent part={part} message={message} />
    case "webfetch":
      return <WebFetchToolComponent part={part} />
    case "list":
      return <ListToolComponent part={part} message={message} />
    case "grep":
      return <GrepToolComponent part={part} />
    case "task":
      return <TaskToolComponent part={part} />
    case "todowrite":
      return <TodoWriteToolComponent part={part} />
    case "todoread":
      return null
    default:
      return <FallbackToolComponent part={part} />
  }
}

const CompletedToolPart = memo(CompletedToolPartComponent)

const FallbackToolComponent = ({
  part,
}: {
  part: ToolPartWithCompletedTool
}) => {
  if (part.type !== "tool") return null

  const tool = part.tool
  const input = part.state?.input
  const output = part.state?.output

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">{tool}</span>
      </div>

      {input && (
        <div className="space-y-1">
          {flattenToolArgs(input).map((arg, index) => (
            <div key={index} className="flex gap-2 text-xs">
              <div className="w-0 flex-1"></div>
              <div className="text-muted-foreground">{arg[0]}</div>
              <div className="text-foreground">{String(arg[1])}</div>
            </div>
          ))}
        </div>
      )}

      {output && (
        <div>
          <ResultsButton>
            <ContentText expand compact text={String(output)} />
          </ResultsButton>
        </div>
      )}
    </div>
  )
}

// Converts nested objects/arrays into [path, value] pairs.
// E.g. {a:{b:{c:1}}, d:[{e:2}, 3]} => [["a.b.c",1], ["d[0].e",2], ["d[1]",3]]
function flattenToolArgs(obj: any, prefix: string = ""): Array<[string, any]> {
  const entries: Array<[string, any]> = []

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === "object") {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayPath = `${path}[${index}]`
          if (item !== null && typeof item === "object") {
            entries.push(...flattenToolArgs(item, arrayPath))
          } else {
            entries.push([arrayPath, item])
          }
        })
      } else {
        entries.push(...flattenToolArgs(value, path))
      }
    } else {
      entries.push([path, value])
    }
  }

  return entries
}

const BashToolComponent = ({ part }: { part: ToolPartWithCompletedTool }) => {
  const command = part.state?.input?.command as string
  const output = part.state?.metadata?.stdout as string
  const description = part.state?.metadata?.description as string

  return (
    <ContentBash
      command={command}
      output={output || ""}
      description={description}
    />
  )
}

const stripWorkingDirectory = (
  filePath?: string | undefined,
  workingDir?: string | undefined
) => {
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

const getShikiLang = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const langs = map.languages(ext)
  const type = langs?.[0]?.toLowerCase()

  const overrides: Record<string, string> = {
    conf: "shellscript",
  }

  return type ? (overrides[type] ?? type) : "plaintext"
}

const EditToolComponent = ({
  message,
  part,
}: {
  message: AssistantMessageWithParts
  part: ToolPartWithCompletedTool
}) => {
  // Extract data from the tool call
  const diff = part.state?.metadata?.diff as string
  const rawFilePath = part.state?.input?.filePath as string

  const filePath = useMemo(() => {
    return stripWorkingDirectory(rawFilePath, message.info.path.cwd)
  }, [rawFilePath, message.info.path.cwd])

  const lang = useMemo(() => {
    return filePath ? getShikiLang(filePath) : "plaintext"
  }, [filePath])

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Edit</span>
        {filePath && (
          <span className="ml-2" title={rawFilePath}>
            {filePath}
          </span>
        )}
      </div>

      {part.state?.metadata?.error ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded">
          Error: {String(part.state.metadata.error)}
        </div>
      ) : diff ? (
        <ContentDiff diff={diff} lang={lang} />
      ) : (
        <div className="text-muted-foreground text-sm">No diff available</div>
      )}
    </div>
  )
}

const GlobToolComponent = ({ part }: { part: ToolPartWithCompletedTool }) => {
  const pattern = part.state?.input?.pattern as string
  const count = part.state?.metadata?.count as number
  const output = part.state?.output as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Glob</span>
        {pattern && (
          <span className="ml-2" title={pattern}>
            &ldquo;{pattern}&rdquo;
          </span>
        )}
      </div>

      <div>
        {count && count > 0 ? (
          <ResultsButton
            showCopy={count === 1 ? "1 result" : `${count} results`}
          >
            <ContentText expand compact text={output} />
          </ResultsButton>
        ) : output ? (
          <ContentText expand text={output} />
        ) : (
          <div className="text-muted-foreground text-sm">No results found</div>
        )}
      </div>
    </div>
  )
}

const WriteToolComponent = ({
  part,
  message,
}: {
  part: ToolPartWithCompletedTool
  message: AssistantMessageWithParts
}) => {
  const filePath = useMemo(() => {
    return stripWorkingDirectory(
      part.state?.input?.filePath as string,
      message.info.path.cwd
    )
  }, [part.state?.input?.filePath, message.info.path.cwd])

  const lang = useMemo(() => {
    return getShikiLang(filePath || "")
  }, [filePath])

  const content = part.state?.input?.content as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Write</span>
        {filePath && (
          <span className="ml-2" title={part.state?.input?.filePath as string}>
            {filePath}
          </span>
        )}
      </div>

      <div>
        {part.state?.metadata?.error ? (
          <ContentError>
            {formatErrorString(String(part.state.output))}
          </ContentError>
        ) : content ? (
          <ResultsButton showCopy="Show contents" hideCopy="Hide contents">
            <ContentCode lang={lang} code={content} />
          </ResultsButton>
        ) : (
          <div className="text-muted-foreground text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  )
}

const WebFetchToolComponent = ({
  part,
}: {
  part: ToolPartWithCompletedTool
}) => {
  const url = part.state?.input?.url as string
  const format = part.state?.input?.format as string
  const output = part.state?.output as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Fetch</span>
        {url && (
          <span className="ml-2" title={url}>
            {url}
          </span>
        )}
      </div>

      <div>
        {part.state?.metadata?.error ? (
          <ContentError>
            {formatErrorString(String(part.state.output))}
          </ContentError>
        ) : output ? (
          <ResultsButton>
            <ContentCode lang={format || "text"} code={output} />
          </ResultsButton>
        ) : (
          <div className="text-muted-foreground text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  )
}

const ListToolComponent = ({
  part,
  message,
}: {
  part: ToolPartWithCompletedTool
  message: AssistantMessageWithParts
}) => {
  const path = useMemo(() => {
    const inputPath = part.state?.input?.path as string
    const cwd = message.info.path.cwd

    if (inputPath !== cwd) {
      return stripWorkingDirectory(inputPath, cwd)
    }
    return inputPath
  }, [part.state?.input?.path, message.info.path.cwd])

  const output = part.state?.output as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">LS</span>
        {path && (
          <span className="ml-2" title={part.state?.input?.path as string}>
            {path}
          </span>
        )}
      </div>

      <div>
        {output ? (
          <ResultsButton>
            <ContentText expand compact text={output} />
          </ResultsButton>
        ) : (
          <div className="text-muted-foreground text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  )
}

const GrepToolComponent = ({ part }: { part: ToolPartWithCompletedTool }) => {
  const pattern = part.state?.input?.pattern as string
  const matches = part.state?.metadata?.matches as number
  const output = part.state?.output as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Grep</span>
        {pattern && (
          <span className="ml-2" title={pattern}>
            &ldquo;{pattern}&rdquo;
          </span>
        )}
      </div>

      <div>
        {matches && matches > 0 ? (
          <ResultsButton
            showCopy={matches === 1 ? "1 match" : `${matches} matches`}
          >
            <ContentText expand compact text={output} />
          </ResultsButton>
        ) : output ? (
          <ContentText expand compact text={output} />
        ) : (
          <div className="text-muted-foreground text-sm">No matches found</div>
        )}
      </div>
    </div>
  )
}

const TaskToolComponent = ({ part }: { part: ToolPartWithCompletedTool }) => {
  const description = part.state?.input?.description as string
  const prompt = part.state?.input?.prompt as string
  const output = part.state?.output as string

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Task</span>
        {description && (
          <span className="ml-2" title={description}>
            {description}
          </span>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        &ldquo;{prompt}&rdquo;
      </div>

      <div>
        {output ? (
          <ResultsButton showCopy="Show output" hideCopy="Hide output">
            <div>
              <ContentMarkdown expand text={output} />
            </div>
          </ResultsButton>
        ) : (
          <div className="text-muted-foreground text-sm">
            No output available
          </div>
        )}
      </div>
    </div>
  )
}

const TodoWriteToolComponent = ({
  part,
}: {
  part: ToolPartWithCompletedTool
}) => {
  const priority: Record<Todo["status"], number> = {
    in_progress: 0,
    pending: 1,
    completed: 2,
  }

  const todos = useMemo(
    () =>
      ((part.state?.input?.todos ?? []) as Todo[])
        .slice()
        .sort((a, b) => priority[a.status] - priority[b.status]),
    [part.state?.input?.todos]
  )

  const starting = useMemo(
    () => todos.every((todo: Todo) => todo.status === "pending"),
    [todos]
  )
  const finished = useMemo(
    () => todos.every((todo: Todo) => todo.status === "completed"),
    [todos]
  )

  const getTitle = () => {
    if (starting) return "Creating plan"
    if (finished) return "Completing plan"
    return "Updating plan"
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">{getTitle()}</span>
      </div>

      {todos.length > 0 && (
        <ul className="space-y-1">
          {todos.map((todo, index) => (
            <li
              key={index}
              className={`flex items-start gap-2 text-sm ${
                todo.status === "completed"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
              data-status={todo.status}
            >
              <span className="flex-shrink-0 mt-0.5">
                {todo.status === "completed" ? (
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                ) : todo.status === "in_progress" ? (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                )}
              </span>
              <span
                className={todo.status === "completed" ? "line-through" : ""}
              >
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const ReadToolComponent = ({
  part,
  message,
}: {
  part: ToolPartWithCompletedTool
  message: AssistantMessageWithParts
}) => {
  // Extract data from the tool call
  const filePath = useMemo(() => {
    return stripWorkingDirectory(
      part.state?.input?.filePath as string,
      message.info.path.cwd
    )
  }, [part.state?.input?.filePath, message.info.path.cwd])

  const lang = useMemo(() => {
    return getShikiLang(filePath || "")
  }, [filePath])

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Read</span>
        {filePath && (
          <span className="ml-2" title={part.state?.input?.filePath as string}>
            {filePath}
          </span>
        )}
      </div>

      <div>
        {part.state?.metadata?.error ? (
          <ContentError>
            {formatErrorString(String(part.state.output))}
          </ContentError>
        ) : typeof part.state?.metadata?.preview === "string" ? (
          <ResultsButton showCopy="Show preview" hideCopy="Hide preview">
            <ContentCode
              lang={lang}
              code={part.state.metadata.preview as string}
            />
          </ResultsButton>
        ) : typeof part.state?.output === "string" && part.state.output ? (
          <ResultsButton>
            <ContentText expand compact text={part.state.output as string} />
          </ResultsButton>
        ) : (
          <div className="text-muted-foreground text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  )
}
