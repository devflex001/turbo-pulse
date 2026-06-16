"use client"

import * as React from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Ban,
  ShieldCheck,
  Pencil,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveBan = {
  _id: Id<"userBans">
  userId: Id<"users">
  reason: string
  bannedAt: number
  bannedUntil: number | null
  isActive: boolean
}

type UserWithBan = {
  _id: Id<"users">
  _creationTime: number
  phone?: string
  activeBan: ActiveBan | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function BanBadge({ ban }: { ban: ActiveBan | null }) {
  if (!ban) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
      >
        Active
      </Badge>
    )
  }
  const isPermanent = ban.bannedUntil === null
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-semibold text-rose-600 border-rose-500/30 bg-rose-500/10"
    >
      {isPermanent ? "Banned (perm)" : "Banned (temp)"}
    </Badge>
  )
}

// ─── Ban Drawer ───────────────────────────────────────────────────────────────

interface BanDrawerProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function BanDrawer({ user, open, onClose }: BanDrawerProps) {
  const banUser = useMutation(api.adminUsers.banUser)
  const [reason, setReason] = React.useState("")
  const [duration, setDuration] = React.useState<string>("permanent")
  const [loading, setLoading] = React.useState(false)

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setReason("")
      setDuration("permanent")
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!reason.trim()) {
      toast.error("Please provide a ban reason")
      return
    }

    const durationHours =
      duration === "permanent"
        ? null
        : duration === "24h"
          ? 24
          : duration === "7d"
            ? 168
            : 720 // 30d

    try {
      setLoading(true)
      await banUser({
        targetUserId: user._id,
        reason: reason.trim(),
        durationHours,
      })
      toast.success("User banned successfully")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user")
    } finally {
      setLoading(false)
    }
  }

  const displayId = user?.phone ?? user?.email ?? user?._id ?? ""

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Ban className="size-4 text-destructive" />
              Ban User
            </DrawerTitle>
            <DrawerDescription>
              <span className="font-mono font-semibold text-foreground">
                {displayId}
              </span>{" "}
              will be restricted from accessing the platform.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="px-6 space-y-4">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-muted-foreground block"
                htmlFor="ban-reason"
              >
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="ban-reason"
                placeholder="e.g. Fraudulent activity, multiple accounts..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none text-sm focus-visible:ring-primary"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-muted-foreground block"
                htmlFor="ban-duration"
              >
                Duration
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="ban-duration" className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>

          <DrawerFooter className="pt-4">
            <Button
              type="submit"
              form="ban-form"
              variant="destructive"
              className="w-full font-semibold"
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Banning...
                </>
              ) : (
                "Confirm Ban"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

interface EditDrawerProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function EditDrawer({ user, open, onClose }: EditDrawerProps) {
  const editUser = useMutation(api.adminUsers.editUser)
  const [phone, setPhone] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Pre-populate when drawer opens
  React.useEffect(() => {
    if (user && open) {
      setPhone(user.phone ?? "")
    }
  }, [user, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!phone.trim()) {
      toast.error("Phone number is required")
      return
    }

    try {
      setLoading(true)
      await editUser({
        targetUserId: user._id,
        phone: phone.trim(),
      })
      toast.success("Phone number updated")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-primary" />
              Edit Phone Number
            </DrawerTitle>
            <DrawerDescription>
              Update phone number for{" "}
              <span className="font-mono font-semibold text-foreground">
                {user?.phone ?? user?._id}
              </span>
              .
            </DrawerDescription>
          </DrawerHeader>

          <form id="edit-user-form" onSubmit={handleSubmit} className="px-6 space-y-4">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-muted-foreground block"
                htmlFor="edit-phone"
              >
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="e.g. +254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="focus-visible:ring-primary text-sm"
                required
                autoFocus
              />
            </div>
          </form>

          <DrawerFooter className="pt-4">
            <Button
              type="submit"
              form="edit-user-form"
              className="w-full font-semibold"
              disabled={loading || !phone.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ─── Main Users Panel ─────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function AdminUsersPanel() {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { results: users, status, loadMore, isLoading } = usePaginatedQuery(
    api.adminUsers.listUsers,
    { search: debouncedSearch || undefined },
    { initialNumItems: PAGE_SIZE }
  )

  const unbanUser = useMutation(api.adminUsers.unbanUser)

  const [banTarget, setBanTarget] = React.useState<UserWithBan | null>(null)
  const [editTarget, setEditTarget] = React.useState<UserWithBan | null>(null)

  async function handleUnban(user: UserWithBan) {
    try {
      await unbanUser({ targetUserId: user._id })
      toast.success(`${user.phone ?? user._id.slice(-8)} has been unbanned`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unban user")
    }
  }

  const displayName = (u: UserWithBan) =>
    u.phone ?? u._id.slice(-8)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="size-5 text-primary" />
            User Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage registered users — ban, unban, and edit profiles.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            id="users-search"
            placeholder="Search by phone, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      <Separator />

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 hidden sm:table-cell">Phone</th>
                <th className="py-3 px-4 hidden md:table-cell">Joined</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden lg:table-cell">Ban Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Loading skeletons */}
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4" colSpan={7}>
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  </tr>
                ))}

              {/* Empty state */}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground text-xs"
                  >
                    No users found.
                  </td>
                </tr>
              )}

              {/* Rows */}
              {users.map((user, idx) => {
                const u = user as UserWithBan
                return (
                  <tr
                    key={u._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-muted-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground max-w-[140px] truncate">
                      {displayName(u)}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground hidden sm:table-cell">
                      {u.phone ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {formatDate(u._creationTime)}
                    </td>
                    <td className="py-3 px-4">
                      <BanBadge ban={u.activeBan} />
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell max-w-[200px]">
                      {u.activeBan ? (
                        <span className="truncate block text-rose-500 text-[11px]">
                          {u.activeBan.reason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-muted"
                            aria-label={`Actions for ${displayName(u)}`}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem
                            onClick={() => setEditTarget(u)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.activeBan ? (
                            <DropdownMenuItem
                              onClick={() => handleUnban(u)}
                              className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                            >
                              <ShieldCheck className="size-3.5" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setBanTarget(u)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Ban className="size-3.5" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Load More footer */}
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-[11px] text-muted-foreground">
              Showing {users.length} user{users.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => loadMore(PAGE_SIZE)}
              disabled={status === "LoadingMore"}
            >
              {status === "LoadingMore" ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <ChevronRight className="size-3.5" />
                  Load More
                </>
              )}
            </Button>
          </div>
        )}

        {status === "Exhausted" && users.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/10">
            <span className="text-[11px] text-muted-foreground">
              All {users.length} user{users.length !== 1 ? "s" : ""} loaded
            </span>
          </div>
        )}
      </div>

      {/* Contextual hint when banned users exist */}
      {!isLoading && users.some((u) => (u as UserWithBan).activeBan) && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Banned users see a suspension notice and can submit an appeal when
            they log in.
          </span>
        </div>
      )}

      {/* Drawers */}
      <BanDrawer
        user={banTarget}
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
      />
      <EditDrawer
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}
