import { ChatLayout } from "@/pages/chat"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { OpencodeClientManager } from "@/components/opencode-client-manager"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OpencodeClientManager />
        <Routes>
          <Route path="/" element={<ChatLayout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
