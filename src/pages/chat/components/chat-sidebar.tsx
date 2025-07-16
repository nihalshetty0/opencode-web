import * as React from "react"
import type { TSession } from "@/types"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  useCreateSession,
  useDeleteSession,
  useGetSessions,
} from "@/hooks/fetch/sessions"

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

export function ChatSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { isLoading } = useGetSessions()

  const navigate = useNavigate()
  const createSessionMutation = useCreateSession()

  const handleNewChat = () => {
    createSessionMutation.mutate(undefined, {
      onSuccess: (newSession) => {
        if (newSession && newSession.id) {
          navigate(`/s/${newSession.id}`)
        }
      },
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 px-2 justify-between">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="-ml-1" />
            <p>Chats</p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewChat}
            disabled={createSessionMutation.isPending || isLoading}
          >
            <Plus />
            {createSessionMutation.isPending ? "Creating..." : "New Chat"}
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

const Session = ({ session }: { session: TSession }) => {
  const navigate = useNavigate()
  const deleteSession = useDeleteSession()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession.mutate(session.id)
  }

  return (
    <SidebarMenuItem key={session.id}>
      <SidebarMenuButton
        className="h-auto text-card-foreground flex flex-col gap-4 border py-3 shadow-sm items-start px-4"
        onClick={() => navigate(`/s/${session.id}`)}
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
