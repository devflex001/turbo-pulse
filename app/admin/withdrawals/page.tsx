"use client"

import * as React from "react"
import { useMutation, useQuery, usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuthClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowDownLeft,
  Check,
  X,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type WithdrawalStatus = "pending" | "approved" | "rejected"

type WithdrawalRequest = {
  _id: Id<"withdrawal_requests">
  userId: Id<"users">
  userPhone: string
  amount: number
  feeAmount: number
  feeTxReference: string
  phone: string
  status: WithdrawalStatus
  isInstant: boolean
  instantFeeTxReference?: string
  requestedAt: number
  processedAt?: number
  processedBy?: string
  rejectionReason?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1"
      >
        <Clock className="size-2.5" />
        Pending
      </Badge>
    )
  }
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1"
      >
        <CheckCircle2 className="size-2.5" />
        Approved
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-semibold text-rose-600 border-rose-500/30 bg-rose-500/10 gap-1"
    >
      <XCircle className="size-2.5" />
      Rejected
    </Badge>
  )
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
  request: WithdrawalRequest | null
  open: boolean
  onClose: () => void
  adminUserId?: Id<"users">
}

function RejectModal({ request, open, onClose, adminUserId }: RejectModalProps) {
  const rejectWithdrawal = useMutation(api.withdrawals.rejectWithdrawal)
  const [reason, setReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setReason(""), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!request) return
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    try {
      setLoading(true)
      await rejectWithdrawal({
        userId: adminUserId,
        requestId: request._id,
        rejectionReason: reason.trim(),
      })
      toast.success("Withdrawal rejected and balance restored")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject withdrawal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Reject Withdrawal"
      description={
        request
          ? `Rejecting KES ${request.amount.toLocaleString()} for ${request.userPhone}. The amount will be restored to their wallet.`
          : ""
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block" htmlFor="reject-reason">
            Reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="reject-reason"
            placeholder="e.g. Account verification required, invalid phone number..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-none text-sm focus-visible:ring-primary"
            disabled={loading}
            required
          />
        </div>
        <div className="pt-2 flex flex-col sm:flex-row-reverse gap-2">
          <Button
            type="submit"
            variant="destructive"
            className="w-full sm:w-auto font-semibold"
            disabled={loading || !reason.trim()}
          >
            {loading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
            Confirm Rejection
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

// ─── Main Panel ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function WithdrawalsPage() {
  const { user } = useAuthClient()
  const stats = useQuery(api.withdrawals.getWithdrawalStats, { userId: user?._id })
  const approveWithdrawal = useMutation(api.withdrawals.approveWithdrawal)

  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("all")
  const [rejectTarget, setRejectTarget] = React.useState<WithdrawalRequest | null>(null)
  const [approvingId, setApprovingId] = React.useState<Id<"withdrawal_requests"> | null>(null)

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.withdrawals.listWithdrawalRequests,
    { statusFilter, userId: user?._id },
    { initialNumItems: PAGE_SIZE }
  )

  const requests = results as WithdrawalRequest[]

  async function handleApprove(req: WithdrawalRequest) {
    try {
      setApprovingId(req._id)
      await approveWithdrawal({
        userId: user?._id,
        requestId: req._id,
      })
      toast.success(`Approved KES ${req.amount.toLocaleString()} for ${req.userPhone}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve withdrawal")
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <AdminLayout pageTitle="Withdrawals">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <ArrowDownLeft className="size-5 text-primary" />
              Withdrawal Requests
            </h1>
            <p className="text-xs text-muted-foreground">
              Review and process user withdrawal requests.
            </p>
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger id="withdrawals-status-filter" className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <ArrowDownLeft className="size-3.5 text-primary" />
              Total
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono">{stats.total}</p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-500" />
              Pending
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Approved
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {stats.approved}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <XCircle className="size-3.5 text-rose-500" />
              Rejected
            </span>
            {stats === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-rose-600 dark:text-rose-400">
                {stats.rejected}
              </p>
            )}
          </div>
        </div>

        {/* ── Mobile cards (< sm) ── */}
        <div className="sm:hidden space-y-2">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {!isLoading && requests.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-xs">
              No withdrawal requests found.
            </div>
          )}
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-lg border border-border bg-card p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold font-mono">{req.userPhone}</span>
                <div className="flex items-center gap-1.5">
                  {req.isInstant && <Zap className="size-3 text-primary" />}
                  <StatusBadge status={req.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span>Amount: <span className="font-semibold text-foreground">KES {req.amount.toLocaleString()}</span></span>
                <span>Fee paid: <span className="font-semibold text-foreground">KES {req.feeAmount.toLocaleString()}</span></span>
                <span>Phone: <span className="text-foreground">{req.phone}</span></span>
                <span>Requested: <span className="text-foreground">{formatDate(req.requestedAt)}</span></span>
              </div>
              {req.rejectionReason && (
                <p className="text-[10px] text-rose-600 bg-rose-500/5 border border-rose-500/10 rounded p-2">
                  Reason: {req.rejectionReason}
                </p>
              )}
              {req.status === "pending" && (
                <div className="flex gap-2 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
                    disabled={approvingId === req._id}
                    onClick={() => handleApprove(req)}
                  >
                    {approvingId === req._id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Check className="size-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setRejectTarget(req)}
                  >
                    <X className="size-3" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Desktop table (≥ sm) ── */}
        <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Fee Paid</th>
                  <th className="py-3 px-4">M-Pesa Phone</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8">
                      <div className="space-y-2 px-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground text-xs">
                      No withdrawal requests found.
                    </td>
                  </tr>
                )}
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold font-mono text-foreground">
                      {req.userPhone}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      KES {req.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      KES {req.feeAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{req.phone}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(req.requestedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={req.status} />
                        {req.isInstant && (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 text-primary border-primary/30 bg-primary/5"
                          >
                            <Zap className="size-2.5" />
                            Instant
                          </Badge>
                        )}
                      </div>
                      {req.rejectionReason && (
                        <p className="text-[10px] text-rose-500 mt-1 max-w-[160px] truncate" title={req.rejectionReason}>
                          {req.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
                            disabled={approvingId === req._id}
                            onClick={() => handleApprove(req)}
                          >
                            {approvingId === req._id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[11px] gap-1 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRejectTarget(req)}
                          >
                            <Ban className="size-3" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {req.processedAt ? formatDate(req.processedAt) : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load more */}
        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => loadMore(PAGE_SIZE)}
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <RejectModal
        request={rejectTarget}
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        adminUserId={user?._id}
      />
    </AdminLayout>
  )
}
