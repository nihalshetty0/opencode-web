import { useEffect, } from "react";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetActiveSession } from "@/hooks/fetch/sessions";

import { cn } from "@/lib/utils";
import { useGetMessages, } from "@/hooks/fetch/messages";
import { ChatInput } from "@/pages/chat/components/chat-input";
import { Messages } from "@/pages/chat/components/messages";

export function SessionChat({ className }: { className?: string }) {
    const {
      data: activeSession,
      isLoading: isActiveSessionLoading,
      isError: isActiveSessionError,
      error: activeSessionError,
    } = useGetActiveSession();
  
    const {
      data: messages,
      isLoading: isMessagesLoading,
      isError: isMessagesError,
      error: messagesError,
    } = useGetMessages({ sessionId: activeSession?.id });
  
    // Streaming: Listen to /event for message updates
    // useEffect(() => {
    //   if (!sessionId) return;
    //   const eventSource = new EventSource("/api/event");
    //   eventSource.onmessage = (event) => {
    //     const eventData = JSON.parse(event.data);
    //     if (
    //       (eventData.type === "message.updated" || eventData.type === "message.part.updated") &&
    //       eventData?.properties?.info?.role === "assistant" &&
    //       eventData?.properties?.info?.sessionID === sessionId
    //     ) {
    //       queryClient.setQueryData(["messages", sessionId], (old: Message[] | undefined) => {
    //         if (!old) return [eventData.properties.info];
    //         const idx = old.findIndex((msg) => msg.id === eventData.properties.info.id);
    //         if (idx !== -1) {
    //           const updated = [...old];
    //           updated[idx] = { ...updated[idx], ...eventData.properties.info };
    //           return updated;
    //         } else {
    //           return [...old, eventData.properties.info];
    //         }
    //       });
    //     }
    //   };
    //   return () => {
    //     eventSource.close();
    //   };
    // }, [sessionId, queryClient]);
  
    useEffect(() => {
      const container = document.getElementById("chat-messages");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages]);
  
    if (isActiveSessionLoading)
      return <div className="p-6">Loading session...</div>;
    if (isActiveSessionError)
      return (
        <div className="p-6 text-red-500">
          {(activeSessionError as Error).message}
        </div>
      );
    if (!activeSession) return <div className="p-6">Session not found.</div>;
  
    return (
      <div
        className={cn(
          "flex flex-col h-full min-h-0 w-full max-w-3xl mx-auto",
          className
        )}
      >
        <div
          id="chat-messages"
          className="flex-1 overflow-y-auto px-6 space-y-2 min-h-0 py-4"
        >
          {isMessagesLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {isMessagesError && (
            <div className="text-red-500">{(messagesError as Error).message}</div>
          )}
          {messages && messages.length === 0 && <div>No messages found.</div>}
  
          <Messages />
        </div>
        <ChatInput />
      </div>
    );
  }
  
  