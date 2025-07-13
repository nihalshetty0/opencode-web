import type { TMessage } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetMessages = ({sessionId}: {sessionId: string | undefined}) =>
  useQuery<TMessage[]>({
    queryKey: ["messages", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/session/${sessionId}/message`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!sessionId,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      providerID,
      modelID,
      mode = "build",
      text,
    }: {
      sessionId: string;
      providerID: string;
      modelID: string;
      mode?: string;
      text: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
      const res = await fetch(`/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerID,
          modelID,
          mode,
          parts: [{ type: "text", text }],
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.sessionId] });
    },
  });
};
