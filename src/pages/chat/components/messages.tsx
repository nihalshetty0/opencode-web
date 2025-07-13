import { Card } from "@/components/ui/card";
import { useGetMessages } from "@/hooks/fetch/messages";
import { useGetActiveSession } from "@/hooks/fetch/sessions";
import type { TMessage, TPart } from "@/types";

export function Messages() {
    const { data: activeSession } = useGetActiveSession();
    const { data: messages } = useGetMessages({ sessionId: activeSession?.id });
  
    return (
      <>
        {messages && messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((msg: TMessage) => (
              <Card key={msg.id} className="p-3">
                <div className="font-semibold">
                  {msg.role === "user" ? "User" : "Assistant"}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(msg.time.created * 1000).toLocaleString()}
                </div>
                {msg.parts &&
                  msg.parts.map((part: TPart, i: number) => {
                    if (part.type === "step-start" || part.type === "step-finish")
                      return null;
                    if (part.type === "text") {
                      return (
                        <div key={i} className="text-sm whitespace-pre-line">
                          {part.text}
                        </div>
                      );
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
                              {part.state.title && (
                                <span className="ml-2 font-mono text-xs">
                                  {part.state.title}
                                </span>
                              )}
                            </div>
                          )}
                          {part.state?.input && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">input:</span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {JSON.stringify(part.state.input, null, 2)}
                              </pre>
                            </div>
                          )}
                          {part.state?.output && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">output:</span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {typeof part.state.output === "string"
                                  ? part.state.output
                                  : JSON.stringify(part.state.output, null, 2)}
                              </pre>
                            </div>
                          )}
                          {part.state?.metadata && (
                            <div className="mb-1">
                              <span className="font-mono text-xs">metadata:</span>
                              <pre className="bg-background rounded p-1 text-xs overflow-x-auto">
                                {JSON.stringify(part.state.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="text-xs text-gray-400">
                        [{part.type}]
                      </div>
                    );
                  })}
              </Card>
            ))}
          </div>
        )}
      </>
    );
  };
  
