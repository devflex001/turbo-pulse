"use client"

import * as React from "react"
import { useMutation, useQuery, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuthClient } from "@/lib/auth-client"
import { AdminLayout } from "@/components/admin-layout"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  ChevronRight,
  Calendar,
  Trophy,
  Loader2,
  TrendingUp,
  DollarSign,
} from "lucide-react"

export interface Selection {
  id: string
  matchId: string
  matchName: string
  team1: string
  team2: string
  market: string
  selection: string
  selectionName: string
  odds: number
  sourceOddId?: string
  marketKey?: string
  marketName?: string
  outcomeName?: string
  specifiers?: string
  matchStartTime?: number
}

export interface Bet {
  _id: Id<"bets">
  _creationTime: number
  userId?: string
  selections: Selection[]
  totalOdds: number
  stake: number
  potentialReturn: number
  status: "active" | "won" | "lost" | "void" | "cancelled"
  placedAt: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(ts: number) {
  return (
    new Date(ts).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "won":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/5"
        >
          Won
        </Badge>
      )
    case "lost":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-rose-600 border-rose-500/30 bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:bg-rose-500/5"
        >
          Lost
        </Badge>
      )
    case "void":
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/5"
        >
          {status === "void" ? "Void" : "Cancelled"}
        </Badge>
      )
    case "active":
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-blue-600 border-blue-500/30 bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:bg-blue-500/5"
        >
          Active
        </Badge>
      )
  }
}

// ─── Details Modal Component ─────────────────────────────────────────────────

interface DetailsModalProps {
  bet: Bet | null
  open: boolean
  onClose: () => void
}

function BetDetailsModal({ bet, open, onClose }: DetailsModalProps) {
  if (!bet) return null

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Bet Ticket Details"
      description={`ID: ${bet._id}`}
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Main Info */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-1">
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Placed At</span>
            <span className="font-medium text-foreground">{formatDateTime(bet.placedAt)}</span>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Status</span>
            <div>
              <StatusBadge status={bet.status} />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Stake</span>
            <span className="font-bold text-foreground font-mono">{bet.stake.toFixed(2)} KES</span>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Potential Return</span>
            <span className="font-bold text-foreground font-mono">{bet.potentialReturn.toFixed(2)} KES</span>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Total Odds</span>
            <span className="font-bold text-foreground font-mono">{bet.totalOdds.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Selections List */}
        <div className="space-y-2">
          <h3 className="font-bold text-primary text-[10px] uppercase tracking-wider">
            Selections ({bet.selections.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {bet.selections.map((sel: Selection, index: number) => (
              <div
                key={sel.id || index}
                className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-1"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-foreground break-words max-w-[80%]">
                    {sel.matchName || `${sel.team1} vs ${sel.team2}`}
                  </span>
                  <span className="font-bold text-primary font-mono whitespace-nowrap">
                    @ {sel.odds.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-muted-foreground">
                  <div>
                    <span className="font-semibold">Market:</span> {sel.marketName || sel.market || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Pick:</span> {sel.selectionName || sel.selection || "N/A"}
                  </div>
                </div>
                {sel.matchStartTime && (
                  <div className="text-[9px] text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                    <Calendar className="size-3" />
                    <span>Starts {formatDateTime(sel.matchStartTime)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

// ─── Main Panel Page ──────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function BetsPage() {
  const { user } = useAuthClient()
  
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  
  const [selectedBet, setSelectedBet] = React.useState<Bet | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Paginated bets query
  const { results: bets, status, loadMore, isLoading } = usePaginatedQuery(
    api.adminBets.listBets,
    {
      search: debouncedSearch || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      userId: user?._id,
    },
    { initialNumItems: PAGE_SIZE }
  )

  // Overall bet statistics
  const betStats = useQuery(api.adminBets.getAdminBetStats, { userId: user?._id })

  // Mutation to update bet status
  const updateStatusMutation = useMutation(api.adminBets.updateBetStatus)

  async function handleUpdateStatus(betId: string, nextStatus: "active" | "won" | "lost" | "void" | "cancelled") {
    try {
      setUpdatingId(betId)
      const res = await updateStatusMutation({
        betId: betId as Id<"bets">,
        status: nextStatus,
        userId: user?._id,
      })
      toast.success(res.message || "Bet status updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bet status")
    } finally {
      setUpdatingId(null)
    }
  }

  function handleViewDetails(bet: Bet) {
    setSelectedBet(bet)
    setDetailsOpen(true)
  }

  return (
    <AdminLayout pageTitle="Bets Panel">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              Bets Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Monitor user bets, inspect ticket details, and manually settle, void, or cancel bets.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Trophy className="size-3.5 text-primary" /> Total Bets
            </span>
            {betStats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono">{betStats.totalBets}</p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <RefreshCw className="size-3.5 text-blue-500" /> Active Bets
            </span>
            {betStats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-blue-600 dark:text-blue-400">
                {betStats.activeBets}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" /> Total Stakes
            </span>
            {betStats === undefined ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {betStats.totalStake.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KES
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-amber-500" /> Total Payouts
            </span>
            {betStats === undefined ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-amber-600 dark:text-amber-400">
                {betStats.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KES
              </p>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              id="bets-search"
              placeholder="Search by Team, Market, Pick, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs focus-visible:ring-primary"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="bets-status-filter" className="h-9 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="void">Void</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Mobile Layout (< sm) ── */}
        <div className="sm:hidden space-y-2">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {!isLoading && bets.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-xs">
              No bets found matching filters.
            </div>
          )}

          {bets.map((bet) => {
            const b = bet as unknown as Bet
            const isSingle = b.selections.length === 1
            const mainSel = b.selections[0]

            return (
              <div
                key={b._id}
                className="rounded-lg border border-border bg-card p-3 space-y-3 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => handleViewDetails(b)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      ID: {b._id.slice(-8)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {formatDateTime(b.placedAt)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <StatusBadge status={b.status} />
                    {updatingId === b._id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                  </div>
                </div>

                <div className="space-y-1">
                  {isSingle ? (
                    <div className="text-xs">
                      <p className="font-bold text-foreground truncate">
                        {mainSel.matchName || `${mainSel.team1} vs ${mainSel.team2}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Pick: <span className="font-semibold text-foreground">{mainSel.selectionName}</span> (@{mainSel.odds.toFixed(2)})
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <p className="font-bold text-foreground">Parlay / Accumulator</p>
                      <p className="text-[10px] text-muted-foreground">
                        {b.selections.length} folds @ total odds <span className="font-semibold text-foreground">{b.totalOdds.toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Stake:</span>{" "}
                    <span className="font-bold text-foreground font-mono">{b.stake} KES</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Ret:</span>{" "}
                    <span className="font-bold text-foreground font-mono">{b.potentialReturn.toFixed(1)} KES</span>
                  </div>
                </div>

                {/* Mobile Quick Actions */}
                <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-[10px] py-0"
                    onClick={() => handleViewDetails(b)}
                  >
                    <Eye className="size-3 mr-1" /> Details
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
                        Actions <ChevronRight className="size-3 ml-0.5 rotate-90" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="text-xs">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                        onClick={() => handleUpdateStatus(b._id, "won")}
                      >
                        <CheckCircle className="size-3.5" /> Settle as Won
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
                        onClick={() => handleUpdateStatus(b._id, "lost")}
                      >
                        <XCircle className="size-3.5" /> Settle as Lost
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                        onClick={() => handleUpdateStatus(b._id, "void")}
                      >
                        <Ban className="size-3.5" /> Void Bet (Refund)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={() => handleUpdateStatus(b._id, "active")}
                      >
                        <RefreshCw className="size-3.5" /> Revert to Active
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Desktop Layout (≥ sm) ── */}
        <div className="hidden sm:block rounded-lg border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Bet ID</th>
                  <th className="py-3 px-4">Placed At</th>
                  <th className="py-3 px-4">Selections</th>
                  <th className="py-3 px-4 text-right">Odds</th>
                  <th className="py-3 px-4 text-right">Stake</th>
                  <th className="py-3 px-4 text-right">Return</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <div className="space-y-2 px-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && bets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground text-xs">
                      No bets found matching filters.
                    </td>
                  </tr>
                )}

                {bets.map((bet) => {
                  const b = bet as unknown as Bet
                  const isSingle = b.selections.length === 1
                  const mainSel = b.selections[0]

                  return (
                    <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-muted-foreground">
                        {b._id.slice(-8)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDateTime(b.placedAt)}
                      </td>
                      <td className="py-3.5 px-4 max-w-[280px]">
                        {isSingle ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground truncate">
                              {mainSel.matchName || `${mainSel.team1} vs ${mainSel.team2}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {mainSel.marketName || mainSel.market}:{" "}
                              <span className="font-medium text-foreground">{mainSel.selectionName}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-foreground">
                              Accumulator / Parlay
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {b.selections.length} folds: {mainSel.selectionName} (+{b.selections.length - 1} more)
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-muted-foreground">
                        {b.totalOdds.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {b.stake.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        {b.potentialReturn.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={b.status} />
                          {updatingId === b._id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 hover:bg-muted">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem onClick={() => handleViewDetails(b)} className="gap-2 cursor-pointer">
                              <Eye className="size-3.5 text-muted-foreground" />
                              View Ticket Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                              onClick={() => handleUpdateStatus(b._id, "won")}
                            >
                              <CheckCircle className="size-3.5" /> Settle as Won
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
                              onClick={() => handleUpdateStatus(b._id, "lost")}
                            >
                              <XCircle className="size-3.5" /> Settle as Lost
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                              onClick={() => handleUpdateStatus(b._id, "void")}
                            >
                              <Ban className="size-3.5" /> Void Bet (Refund)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => handleUpdateStatus(b._id, "active")}
                            >
                              <RefreshCw className="size-3.5" /> Revert to Active
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginated Footer */}
          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                Showing {bets.length} bet{bets.length !== 1 ? "s" : ""}
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
        </div>
      </div>

      {/* Bet Details Modal */}
      <BetDetailsModal
        bet={selectedBet}
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedBet(null)
        }}
      />
    </AdminLayout>
  )
}
