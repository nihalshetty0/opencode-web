import type { TSession } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

export const useGetSessions = () =>
  useQuery<TSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/session");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: TSession[] = await res.json();
      data.sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0));
      return data;
    },
  });

export const useGetActiveSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const states = useGetSessions();

  const activeSession = useMemo(() => {
    if (!states.data || !sessionId) return null;
    return states.data.find((s) => s.id === sessionId);
  }, [states.data, sessionId]);

  return { ...states, data: activeSession };
};

/**
 * Create a new session.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

/**
 * Delete a session by ID.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/session/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
