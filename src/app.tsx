import { ChatLayout } from "@/pages/chat"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"

export const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatLayout />} />
          <Route path="/s/:sessionId" element={<ChatLayout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
