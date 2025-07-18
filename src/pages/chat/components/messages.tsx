import type { MessageWithParts } from "@/types"
import type { Opencode } from "@opencode-ai/sdk"

import { StickToBottom, StickToBottomContent } from "@/lib/use-stick-to-bottom"
import { useGetMessages } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

import { Card } from "@/components/ui/card"

export function Messages() {
  const { data: activeSession } = useGetActiveSession()
  const { data: messages } = useGetMessages({ sessionId: activeSession?.id })

  return (
    <StickToBottom scrollMode="document">
      <StickToBottomContent>
        {messages && messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((msg: MessageWithParts) => (
              <Card key={msg.info.id} className="p-3">
                <div className="font-semibold">
                  {/* <pre>{JSON.stringify(msg.info, null, 2)}</pre> */}
                  {msg.info.role === "user" ? "User" : "Assistant"}
                </div>
                {msg.parts &&
                  msg.parts.map((part: Opencode.Part, i: number) => {
                    // if (
                    //   part.type === "step-start" ||
                    //   part.type === "step-finish"
                    // )
                    //   return null
                    if (part.type === "text") {
                      return (
                        <div key={i} className="text-sm whitespace-pre-line">
                          {part.text}
                        </div>
                      )
                    }
                    if (part.type === "tool") {
                      return (
                        <div
                          key={i}
                          className="text-sm bg-muted rounded p-2 my-2"
                        >
                          <div className="font-mono text-xs mb-1">
                            [tool: {part.tool}]
                          </div>
                          {part.state && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">
                                status: {part.state.status}
                              </span>
                              {part.tool && (
                                <span className="ml-2 font-mono text-xs">
                                  {part.tool}
                                </span>
                              )}
                            </div>
                          )}
                          {/* {part. && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">
                                input:
                              </span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {JSON.stringify(part.state.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          {part.state?.output && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">
                                output:
                              </span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {typeof part.state.output === "string"
                                  ? part.state.output
                                  : JSON.stringify(
                                      part.state.output,
                                      null,
                                      2
                                    )}
                              </pre>
                            </div>
                          )}
                          {part.state?.metadata && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">
                                metadata:
                              </span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {JSON.stringify(part.state.metadata, null, 2)}
                              </pre>
                            </div>
                          )} */}
                        </div>
                      )
                    }
                    return (
                      <div key={i} className="text-xs text-gray-400">
                        [{part.type}]
                      </div>
                    )

                    return null
                  })}
              </Card>
            ))}
          </div>
        )}
      </StickToBottomContent>
    </StickToBottom>
  )
}
