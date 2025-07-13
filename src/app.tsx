import { BrowserRouter, Routes, Route } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatLayout } from "@/pages/chat";

const queryClient = new QueryClient();

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
  );
}
