"use client"

import * as React from "react"
import { useQuery, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuthClient } from "@/lib/auth-client"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Globe,
  Loader2,
  ChevronRight,
  Clock,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Transaction {
  _id: Id<"transactions">
  _creationTime: number
  txId: string
  type: string
  amount: number
  phone?: string
  status: string
  errorDetail?: string
  time: number
  checkoutRequestID?: string
  merchantRequestID?: string
  resultCode?: string
  resultDesc?: string
  mpesaReceiptNumber?: string
  feedback?: string
  feedbackType?: "success" | "error" | "warning"
  updatedAt?: number
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
    case "success":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/5"
        >
          Success
        </Badge>
      )
    case "failed":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-rose-600 border-rose-500/30 bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:bg-rose-500/5"
        >
          Failed
        </Badge>
      )
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/5"
        >
          Cancelled
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold text-blue-600 border-blue-500/30 bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:bg-blue-500/5"
        >
          Pending
        </Badge>
      )
  }
}

// ─── Details Modal ───────────────────────────────────────────────────────────

interface DetailsModalProps {
  tx: Transaction | null
  open: boolean
  onClose: () => void
}

function TransactionDetailsModal({ tx, open, onClose }: DetailsModalProps) {
  if (!tx) return null

  const isPaystack = tx.txId.includes("PAYSTACK")
  const gateway = isPaystack ? "Paystack" : "M-Pesa"

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Payment Details"
      description={`Transaction ID: ${tx.txId}`}
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Amount</span>
            <span className="font-bold text-foreground font-mono text-sm">{tx.amount.toFixed(2)} KES</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Status</span>
            <div>
              <StatusBadge status={tx.status} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Gateway</span>
            <span className="font-medium text-foreground">{gateway}</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Phone / Account</span>
            <span className="font-medium text-foreground font-mono">{tx.phone ?? "N/A"}</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground block">Initiated At</span>
            <span className="font-medium text-foreground">{formatDateTime(tx.time)}</span>
          </div>

          {tx.updatedAt && (
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground block">Updated At</span>
              <span className="font-medium text-foreground">{formatDateTime(tx.updatedAt)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider">Gateway Reference Data</h3>

          <div className="grid grid-cols-3 gap-y-2 gap-x-2 rounded-lg border border-border bg-muted/20 p-2.5 font-mono text-[10px]">
            {tx.mpesaReceiptNumber && (
              <>
                <span className="font-semibold text-muted-foreground">Receipt No:</span>
                <span className="col-span-2 text-foreground break-all select-all font-bold">{tx.mpesaReceiptNumber}</span>
              </>
            )}

            {tx.checkoutRequestID && (
              <>
                <span className="font-semibold text-muted-foreground">Checkout ID:</span>
                <span className="col-span-2 text-foreground break-all">{tx.checkoutRequestID}</span>
              </>
            )}

            {tx.merchantRequestID && (
              <>
                <span className="font-semibold text-muted-foreground">Merchant ID:</span>
                <span className="col-span-2 text-foreground break-all">{tx.merchantRequestID}</span>
              </>
            )}

            {tx.resultCode !== undefined && (
              <>
                <span className="font-semibold text-muted-foreground">Result Code:</span>
                <span className="col-span-2 text-foreground">{tx.resultCode}</span>
              </>
            )}
          </div>
        </div>

        {(tx.feedback || tx.errorDetail) && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <span className="font-semibold text-muted-foreground block">System Status Message</span>
              <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-medium">
                {tx.feedback && <p className="text-foreground">{tx.feedback}</p>}
                {tx.errorDetail && <p className="text-destructive font-mono text-[10px] mt-0.5">{tx.errorDetail}</p>}
              </div>
            </div>
          </>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 text-xs font-semibold" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

// ─── Page Component ──────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function PaymentsPage() {
  const { user } = useAuthClient()

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Paginated payments list
  const { results: transactions, status, loadMore, isLoading } = usePaginatedQuery(
    api.adminTransactions.listTransactions,
    {
      typeFilter: "deposit",
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      search: debouncedSearch || undefined,
      userId: user?._id,
    },
    { initialNumItems: PAGE_SIZE }
  )

  // Aggregated stats
  const stats = useQuery(api.adminTransactions.getAdminTransactionStats, {
    type: "deposit",
    userId: user?._id,
  })

  function handleViewDetails(tx: Transaction) {
    setSelectedTx(tx)
    setModalOpen(true)
  }

  return (
    <AdminLayout pageTitle="Payments Panel">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <ArrowUpRight className="size-5 text-emerald-500" />
              Payments Administration
            </h1>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" /> Total Deposits
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono">{stats.totalCount}</p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" /> Success Rate
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {stats.totalCount > 0 ? `${Math.round((stats.successCount / stats.totalCount) * 100)}%` : "0%"}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-primary" /> Total Volume
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KES
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-blue-500" /> Pending Count
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-blue-600 dark:text-blue-400">
                {stats.pendingCount}
              </p>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              id="payments-search"
              placeholder="One Term..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs focus-visible:ring-primary"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="payments-status-filter" className="h-9 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Mobile Layout (< lg) ── */}
        <div className="lg:hidden space-y-2">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {!isLoading && transactions.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-xs">
              No payments found matching filters.
            </div>
          )}

          {transactions.map((tx) => {
            const t = tx as unknown as Transaction
            const isPaystack = t.txId.includes("PAYSTACK")
            const gateway = isPaystack ? "Paystack" : "M-Pesa"

            return (
              <div
                key={t._id}
                className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => handleViewDetails(t)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {t.txId.slice(0, 16)}...
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {formatDateTime(t.time)}
                    </span>
                  </div>
                  <div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Method:</span>{" "}
                    <span className="font-semibold text-foreground">{gateway}</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground font-mono">{t.amount.toFixed(2)} KES</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Desktop Layout (≥ lg) ── */}
        <div className="hidden lg:block rounded-lg border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Initiated At</th>
                  <th className="py-3 px-4">Phone / Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <div className="space-y-2 px-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground text-xs">
                      No payments found matching filters.
                    </td>
                  </tr>
                )}

                {transactions.map((tx, idx) => {
                  const t = tx as unknown as Transaction
                  const isPaystack = t.txId.includes("PAYSTACK")
                  const gateway = isPaystack ? "Paystack" : "M-Pesa"

                  return (
                    <tr
                      key={t._id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(t)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-muted-foreground w-12">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                        {gateway}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDateTime(t.time)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {t.phone ?? "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        {t.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                Showing {transactions.length} payment{transactions.length !== 1 ? "s" : ""}
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

      {/* Details Modal */}
      <TransactionDetailsModal
        tx={selectedTx}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTx(null)
        }}
      />
    </AdminLayout>
  )
}
