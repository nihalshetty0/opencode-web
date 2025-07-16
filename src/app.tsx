import { useState } from "react"
import { ChatLayout } from "@/pages/chat"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { StickToBottom, StickToBottomContent } from "@/lib/use-stick-to-bottom"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatLayout />} />
          <Route path="/s/:sessionId" element={<ChatLayout />} />
          <Route path="sd" element={<Sd />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const Sd = () => {
  const [count, setCount] = useState(100)

  return (
    <div className="flex h-screen">
      <div className="w-[400px] border-r">
        <div className="fixed inset-0">
          <button onClick={() => setCount(count + 1)}>add</button>
          <button onClick={() => setCount(count - 100)}>sub</button>
        </div>
      </div>
      <div
        className="flex-1"
        //ref={contentRef}
      >
        <StickToBottom scrollMode="document">
          <StickToBottomContent
          // ref={contentRef}
          >
            {new Array(count).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-red-500">
                {i}
              </div>
            ))}
          </StickToBottomContent>
        </StickToBottom>
      </div>
    </div>
  )
}
