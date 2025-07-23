import { queryClient } from "@/app"
import { useOpencodeClientStore } from "@/store/opencode-client"
import type { MessageWithParts } from "@/types"
import type { Opencode } from "@opencode-ai/sdk"
import { Stream } from "@opencode-ai/sdk/core/streaming"
import { create } from "zustand"

import { getSessionIdFromEvent, isSessionBusy } from "@/lib/utils"

interface BusySessionStore {
  busySessions: Record<string, boolean>
  isInitialized: boolean
  streamRef: Stream<Opencode.EventListResponse> | null
  setSessionBusy: (sessionId: string, isBusy: boolean) => void
  init: () => Promise<void>
  cleanup: () => void
}

export const useBusySessionStore = create<BusySessionStore>((set, get) => ({
  busySessions: {},
  isInitialized: false,
  streamRef: null,

  setSessionBusy: (sessionId: string, isBusy: boolean) =>
    set((state) => ({
      busySessions: {
        ...state.busySessions,
        [sessionId]: isBusy,
      },
    })),

  init: async () => {
    const state = get()
    if (state.isInitialized) return

    const opencodeClient = useOpencodeClientStore.getState().client
    if (!opencodeClient) {
      console.warn("OpencodeClient not available for busy state initialization")
      return
    }

    set({ isInitialized: true })

    try {
      const sessions = await opencodeClient.session.list()

      // Check busy state for each session
      for (const session of sessions) {
        // Fetch messages for this session if not in cache
        const currentMessages =
          (await queryClient.fetchQuery<MessageWithParts[]>({
            queryKey: ["messages", session.id],
            queryFn: () => opencodeClient.session.messages(session.id),
            staleTime: 5 * 60 * 1000, // 5 minutes
          })) || []

        const busy = isSessionBusy(currentMessages)
        get().setSessionBusy(session.id, busy)
      }

      // Now start listening to events
      const stream = await opencodeClient.event.list({
        query: {}, // No sessionID = all events
      })

      set({ streamRef: stream })

      // Process each event from the stream
      for await (const eventData of stream) {
        const currentState = get()
        if (!currentState.isInitialized) break

        // Extract session ID from event
        const sessionId = getSessionIdFromEvent(eventData)
        if (!sessionId) continue

        // Get current messages for this session
        const currentMessages =
          queryClient.getQueryData<MessageWithParts[]>([
            "messages",
            sessionId,
          ]) || []

        // Update busy state based on current messages
        const busy = isSessionBusy(currentMessages)

        get().setSessionBusy(sessionId, busy)
      }
    } catch (error) {
      console.error("Error in global busy state stream:", error)
      set({ isInitialized: false })
    }
  },

  cleanup: () => {
    const state = get()
    if (state.streamRef) {
      state.streamRef.controller.abort()
    }
    set({
      isInitialized: false,
      streamRef: null,
    })
  },
}))
