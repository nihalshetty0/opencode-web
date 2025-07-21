import * as React from "react"
import { useLastSessionStore } from "@/store/last-session"
import type { Opencode } from "@opencode-ai/sdk"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { useGetSessions } from "@/hooks/fetch/sessions"
import { useUrlParams } from "@/hooks/use-url-params"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { InstanceSwitcher } from "@/components/instance-switcher"

export function ChatSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isLoading } = useGetSessions()

  const [, setSearchParams] = useSearchParams()

  const handleNewChat = () => {
    // Clear session param to start a fresh draft; first message will create session
    setSearchParams((prev: URLSearchParams) => {
      const next = new URLSearchParams(prev)
      next.delete("session")
      return next
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="px-3 py-4 space-y-3">
        <InstanceSwitcher />
        <div className="flex items-center gap-2 px-2 justify-between">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="-ml-1" />
            <p>Chats</p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewChat}
            disabled={isLoading}
          >
            <Plus />
            New Chat
          </Button>
        </div>
        {/* TODO: search for sessions */}
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarGroup className="pt-1 px-3">
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="gap-2">
              <SessionList />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

const SessionList = () => {
  const { data: sessions, isLoading, isError, error } = useGetSessions()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (isError) {
    return <div className="text-red-500">{error.message}</div>
  }

  if (sessions === undefined || (sessions && sessions.length === 0)) {
    // TODO: Add a button to create a new session or create a new session on first chat message
    return <div>No sessions found.</div>
  }

  return (
    <>
      {sessions.map((session) => (
        <Session key={session.id} session={session} />
      ))}
    </>
  )
}

const Session = ({ session }: { session: Opencode.Session }) => {
  const [, setSearchParams] = useSearchParams()
  const setLastSession = useLastSessionStore((s) => s.setLastSession)
  const { cwd } = useUrlParams()

  // const deleteSession = useDeleteSession()

  // const handleDelete = () => {
  //   deleteSession.mutate(session.id)
  // }

  return (
    <SidebarMenuItem key={session.id}>
      <SidebarMenuButton
        className="h-auto text-card-foreground flex flex-col gap-4 border py-3 shadow-sm items-start px-4"
        onClick={() => {
          if (cwd) setLastSession(cwd, session.id)
          setSearchParams((prev: URLSearchParams) => {
            const next = new URLSearchParams(prev)
            next.set("session", session.id)
            return next
          })
        }}
      >
        <span className="font-semibold">{session.title || session.id}</span>
        <span className="text-xs text-gray-500">ID: {session.id}</span>
        {/* TODO: need better UX to delete sessions */}
        {/* <button
          type="button"
          className="mt-2 text-red-500 text-xs self-end"
          onClick={handleDelete}
          disabled={deleteSession.isPending}
          aria-label="Delete session"
        >
          {deleteSession.isPending ? "Deleting..." : "Delete"}
        </button> */}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
