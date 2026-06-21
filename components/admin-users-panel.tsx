"use client"

import * as React from "react"
import { useMutation, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SmallLoader } from "@/components/small-loader"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
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
  Eye,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveBan = {
  _id: string
  userId: string
  reason: string
  bannedAt: number
  bannedUntil: number | null
  isActive: boolean
}

type UserWithBan = {
  _id: string
  _creationTime: number
  phone?: string
  id?: string
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

interface BanModalProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function BanModal({ user, open, onClose }: BanModalProps) {
  // const banUser = useMutation(api.adminUsers.banUser)
  const [reason, setReason] = React.useState("")
  const [duration, setDuration] = React.useState<string>("permanent")
  const [loading, setLoading] = React.useState(false)

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setReason("")
        setDuration("permanent")
      }, 0)
      return () => window.clearTimeout(timer)
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

  const displayId = user?.phone ?? user?._id ?? ""

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Ban User"
      description={`User ${displayId} will be restricted from accessing the platform.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
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

        <div className="pt-4 flex flex-col sm:flex-row-reverse gap-2">
          <Button
            type="submit"
            variant="destructive"
            className="w-full sm:w-auto font-semibold"
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
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

interface EditModalProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function EditModal({ user, open, onClose }: EditModalProps) {
  const editUser = useMutation(api.adminUsers.editUser)
  const [phone, setPhone] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Pre-populate when drawer opens
  React.useEffect(() => {
    if (user && open) {
      const timer = window.setTimeout(() => {
        setPhone(user.phone ?? "")
      }, 0)
      return () => window.clearTimeout(timer)
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
        email: phone.trim(),
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
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Edit Phone Number"
      description={`Update phone number for ${user?.phone ?? user?._id}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
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

        <div className="pt-4 flex flex-col sm:flex-row-reverse gap-2">
          <Button
            type="submit"
            className="w-full sm:w-auto font-semibold"
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
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

// ─── Details Modal ───────────────────────────────────────────────────────────

interface UserDetailsModalProps {
  user: UserWithBan | null
  open: boolean
  onClose: () => void
}

function UserDetailsModal({ user, open, onClose }: UserDetailsModalProps) {
  if (!user) return null

  const displayId = user.phone ?? user._id

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="User Details"
      description="Detailed overview of the user account status and profile."
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 py-1">
          <span className="font-semibold text-muted-foreground">User ID:</span>
          <span className="col-span-2 font-mono break-all text-foreground select-all">
            {user._id}
          </span>

          <span className="font-semibold text-muted-foreground">Phone Number:</span>
          <span className="col-span-2 font-mono text-foreground">
            {user.phone ?? "N/A"}
          </span>

          <span className="font-semibold text-muted-foreground">Joined:</span>
          <span className="col-span-2 text-foreground">
            {formatDate(user._creationTime)} at {new Date(user._creationTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
          </span>

          <span className="font-semibold text-muted-foreground">Status:</span>
          <div className="col-span-2">
            <BanBadge ban={user.activeBan} />
          </div>
        </div>

        {user.activeBan && (
          <>
            <Separator />
            <div className="space-y-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <h3 className="font-bold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" />
                Suspension Details
              </h3>

              <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-[11px]">
                <span className="font-semibold text-muted-foreground">Banned At:</span>
                <span className="col-span-2 text-foreground">
                  {formatDate(user.activeBan.bannedAt)}
                </span>

                <span className="font-semibold text-muted-foreground">Banned Until:</span>
                <span className="col-span-2 text-foreground">
                  {user.activeBan.bannedUntil
                    ? formatDate(user.activeBan.bannedUntil)
                    : "Permanent"}
                </span>

                <span className="font-semibold text-muted-foreground">Ban Reason:</span>
                <span className="col-span-2 text-foreground whitespace-pre-wrap break-words font-medium">
                  {user.activeBan.reason}
                </span>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ResponsiveModal>
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
  const [detailTarget, setDetailTarget] = React.useState<UserWithBan | null>(null)

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

      {/* ── Mobile Card List (< sm) ── */}
      <div className="sm:hidden space-y-2">
        {isLoading && (
          <SmallLoader />
        )}

        {!isLoading && users.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No users found.
          </div>
        )}

        {users.map((user, idx) => {
          const u = { ...user, _id: (user as any)._id ?? (user as any).id, _creationTime: (user as any)._creationTime ?? (user as any).createdAt ?? 0, activeBan: (user as any).activeBan ?? null } as UserWithBan
          return (
            <div
              key={u._id}
              className="rounded-lg border border-border bg-card p-3 space-y-2.5 cursor-pointer hover:bg-muted/10 transition-colors"
              onClick={() => setDetailTarget(u)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold font-mono text-foreground truncate">
                    {u.phone ?? u._id.slice(-8)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <BanBadge ban={u.activeBan} />
                  <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  Joined {formatDate(u._creationTime)}
                </p>
              </div>

              <div className="flex gap-2 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditTarget(u)
                  }}
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                {u.activeBan ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnban(u)
                    }}
                  >
                    <ShieldCheck className="size-3" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setBanTarget(u)
                    }}
                  >
                    <Ban className="size-3" />
                    Ban
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop Table (≥ sm) ── */}
      <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 hidden md:table-cell">Joined</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <SmallLoader />
                  </td>
                </tr>
              )}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-muted-foreground text-xs"
                  >
                    No users found.
                  </td>
                </tr>
              )}

              {users.map((user, idx) => {
                const u = { ...user, _id: (user as any)._id ?? (user as any).id, _creationTime: (user as any)._creationTime ?? (user as any).createdAt ?? 0, activeBan: (user as any).activeBan ?? null } as UserWithBan
                return (
                  <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold font-mono text-foreground max-w-[160px] truncate">
                      {u.phone ?? u._id.slice(-8)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {formatDate(u._creationTime)}
                    </td>
                    <td className="py-3 px-4">
                      <BanBadge ban={u.activeBan} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-muted"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem
                            onClick={() => setDetailTarget(u)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setEditTarget(u)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                            Edit Phone
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
                <><ChevronRight className="size-3.5" /> Load More</>
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

      {/* Mobile Load More (below cards) */}
      <div className="sm:hidden">
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-1.5"
            onClick={() => loadMore(PAGE_SIZE)}
            disabled={status === "LoadingMore"}
          >
            {status === "LoadingMore" ? (
              <><Loader2 className="size-3.5 animate-spin" /> Loading...</>
            ) : (
              <><ChevronRight className="size-3.5" /> Load More</>
            )}
          </Button>
        )}
        {status === "Exhausted" && users.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-2">
            All {users.length} user{users.length !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>

      {/* Contextual hint when banned users exist */}
      {!isLoading && users.some((u) => !!(u as any).activeBan) && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            Banned users see a suspension notice and can submit an appeal when
            they log in.
          </span>
        </div>
      )}

      {/* Modals */}
      <UserDetailsModal
        user={detailTarget}
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
      />
      <BanModal
        user={banTarget}
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
      />
      <EditModal
        user={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}
