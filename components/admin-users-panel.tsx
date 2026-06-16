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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  email?: string
  name?: string
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

// ─── Ban Dialog ───────────────────────────────────────────────────────────────

interface BanDialogProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function BanDialog({ user, open, onClose }: BanDialogProps) {
  const banUser = useMutation(api.adminUsers.banUser)
  const [reason, setReason] = React.useState("")
  const [duration, setDuration] = React.useState<string>("permanent")
  const [loading, setLoading] = React.useState(false)

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
            : duration === "30d"
              ? 720
              : null

    try {
      setLoading(true)
      await banUser({
        targetUserId: user._id,
        reason: reason.trim(),
        durationHours,
      })
      toast.success(`User banned successfully`)
      setReason("")
      setDuration("permanent")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Ban className="size-4 text-destructive" />
            Ban User
          </DialogTitle>
          <DialogDescription className="text-xs">
            {user?.phone ?? user?.email ?? user?._id} will be restricted from
            accessing the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1 text-xs font-semibold"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Banning...</>
              ) : (
                "Confirm Ban"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function EditDialog({ user, open, onClose }: EditDialogProps) {
  const editUser = useMutation(api.adminUsers.editUser)
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Populate on open
  React.useEffect(() => {
    if (user && open) {
      setPhone(user.phone ?? "")
      setEmail(user.email ?? "")
      setName(user.name ?? "")
    }
  }, [user, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      await editUser({
        targetUserId: user._id,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        name: name.trim() || undefined,
      })
      toast.success("User updated successfully")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Pencil className="size-4 text-primary" />
            Edit User
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update profile fields for {user?.phone ?? user?.email ?? user?._id}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block" htmlFor="edit-phone">
              Phone Number
            </label>
            <Input
              id="edit-phone"
              type="tel"
              placeholder="e.g. +254712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="focus-visible:ring-primary text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block" htmlFor="edit-email">
              Email Address
            </label>
            <Input
              id="edit-email"
              type="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="focus-visible:ring-primary text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block" htmlFor="edit-name">
              Display Name
            </label>
            <Input
              id="edit-name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="focus-visible:ring-primary text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-xs font-semibold"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Users Panel ─────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function AdminUsersPanel() {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const {
    results: users,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
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
      toast.success(`${user.phone ?? user.email ?? "User"} has been unbanned`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unban user")
    }
  }

  const displayName = (u: UserWithBan) =>
    u.name ?? u.phone ?? u.email ?? u._id.slice(-8)

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
          <table className="w-full text-left text-xs border-collapse">
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
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4" colSpan={7}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground text-xs"
                  >
                    No users found.
                  </td>
                </tr>
              )}

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
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell max-w-[200px]">
                      {u.activeBan ? (
                        <span className="truncate block text-rose-500">
                          {u.activeBan.reason}
                        </span>
                      ) : (
                        "—"
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

        {/* Load More / Pagination footer */}
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
                <><Loader2 className="size-3 animate-spin" /> Loading...</>
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

      {/* Ban notice for result context */}
      {!isLoading && users.some((u) => (u as UserWithBan).activeBan) && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Banned users will see a ban notification when they try to access
            the platform and can submit an appeal.
          </span>
        </div>
      )}

      {/* Dialogs */}
      <BanDialog
        user={banTarget}
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
      />
      <EditDialog
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}
