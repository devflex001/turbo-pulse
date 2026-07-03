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
import { Textarea } from "@/components/ui/textarea"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  ArrowDownLeft,
  Check,
  Ban,
  Zap,
  XCircle,
  Clock,
  CheckCircle2,
  Loader2,
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
  if (status === "pending")
    return (
      <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
        <Clock className="size-2.5" /> Pending
      </Badge>
    )
  if (status === "approved")
    return (
      <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1">
        <CheckCircle2 className="size-2.5" /> Approved
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px] font-semibold text-rose-600 border-rose-500/30 bg-rose-500/10 gap-1">
      <XCircle className="size-2.5" /> Rejected
    </Badge>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  request, open, onClose, onApprove, onReject, approvingId,
}: {
  request: WithdrawalRequest | null
  open: boolean
  onClose: () => void
  onApprove: (req: WithdrawalRequest) => Promise<void>
  onReject: (req: WithdrawalRequest) => void
  approvingId: Id<"withdrawal_requests"> | null
}) {
  if (!request) return null
  return (
    <ResponsiveModal open={open} onOpenChange={(v) => !v && onClose()} title="Withdrawal Details" description="">
      <div className="space-y-4 py-1">
        <div className="space-y-2.5 text-sm">
          {[
            ["User", <span className="font-mono font-semibold">{request.userPhone}</span>],
            ["Amount", <span className="font-mono font-semibold">KES {request.amount.toLocaleString()}</span>],
            ["Fee Paid", <span className="font-mono text-muted-foreground">KES {request.feeAmount.toLocaleString()}</span>],
            ["M-Pesa Phone", <span className="font-mono">{request.phone}</span>],
            ["Type", <span>{request.isInstant ? "Instant" : "Standard"}</span>],
            ["Requested", <span className="text-muted-foreground">{formatDate(request.requestedAt)}</span>],
            ...(request.processedAt ? [["Processed", <span className="text-muted-foreground">{formatDate(request.processedAt)}</span>]] : []),
            ["Status", <StatusBadge status={request.status} />],
            ...(request.rejectionReason ? [["Reason", <span className="text-rose-500 text-right max-w-[60%]">{request.rejectionReason}</span>]] : []),
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-muted-foreground">{label as string}</span>
              {value as React.ReactNode}
            </div>
          ))}
        </div>
        {request.status === "pending" && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
              disabled={approvingId === request._id}
              onClick={async () => { await onApprove(request); onClose() }}
            >
              {approvingId === request._id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs gap-1.5 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
              onClick={() => { onReject(request); onClose() }}
            >
              <Ban className="size-3.5" /> Reject
            </Button>
          </div>
        )}
      </div>
    </ResponsiveModal>
  )
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  request, open, onClose, adminUserId,
}: {
  request: WithdrawalRequest | null
  open: boolean
  onClose: () => void
  adminUserId?: Id<"users">
}) {
  const { sessionToken } = useAuthClient()
  const rejectWithdrawal = useMutation(api.withdrawals.rejectWithdrawal)
  const [reason, setReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) { const t = setTimeout(() => setReason(""), 200); return () => clearTimeout(t) }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!request || !reason.trim()) { toast.error("Please provide a rejection reason"); return }
    try {
      setLoading(true)
      await rejectWithdrawal({ userId: adminUserId, sessionToken: sessionToken || undefined, requestId: request._id, rejectionReason: reason.trim() })
      toast.success("Withdrawal rejected and balance restored")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject withdrawal")
    } finally { setLoading(false) }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Reject Withdrawal"
      description={request ? `Rejecting KES ${request.amount.toLocaleString()} for ${request.userPhone}. The balance will be restored.` : ""}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block" htmlFor="reject-reason">
            Reason <span className="text-destructive">*</span>
          </label>
          <Textarea id="reject-reason" placeholder="e.g. Account verification required..." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="resize-none text-sm focus-visible:ring-primary" disabled={loading} required />
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Confirm Rejection
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function WithdrawalsPage() {
  const { user, sessionToken } = useAuthClient()
  const stats = useQuery(api.withdrawals.getWithdrawalStats, { userId: user?._id })
  const approveWithdrawal = useMutation(api.withdrawals.approveWithdrawal)

  const [rejectTarget, setRejectTarget] = React.useState<WithdrawalRequest | null>(null)
  const [detailTarget, setDetailTarget] = React.useState<WithdrawalRequest | null>(null)
  const [approvingId, setApprovingId] = React.useState<Id<"withdrawal_requests"> | null>(null)

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.withdrawals.listWithdrawalRequests,
    { statusFilter: "all", userId: user?._id },
    { initialNumItems: PAGE_SIZE }
  )

  const requests = results as WithdrawalRequest[]

  async function handleApprove(req: WithdrawalRequest) {
    try {
      setApprovingId(req._id)
      await approveWithdrawal({ userId: user?._id, sessionToken: sessionToken || undefined, requestId: req._id })
      toast.success(`Approved KES ${req.amount.toLocaleString()} for ${req.userPhone}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve withdrawal")
    } finally { setApprovingId(null) }
  }

  return (
    <AdminLayout pageTitle="Withdrawals">
      <div className="space-y-4">

        {/* Header */}
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight">Withdrawal Requests</h1>
          <p className="text-xs text-muted-foreground">Tap a row to view full details.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <ArrowDownLeft className="size-3.5 text-primary" /> Total
            </span>
            {stats === undefined ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold tracking-tight font-mono">{stats.total}</p>
            )}
          </div>
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <XCircle className="size-3.5 text-rose-500" /> Rejected
            </span>
            {stats === undefined ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold tracking-tight font-mono text-rose-600 dark:text-rose-400">{stats.rejected}</p>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg sm:h-11" />
            <Skeleton className="h-20 w-full rounded-lg sm:h-11" />
            <Skeleton className="h-20 w-full rounded-lg sm:h-11" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && requests.length === 0 && (
          <div className="rounded-lg border border-border bg-card py-16 text-center text-xs text-muted-foreground">
            No withdrawal requests found.
          </div>
        )}

        {/* ── Mobile cards (< sm) ── */}
        {!isLoading && requests.length > 0 && (
          <div className="sm:hidden space-y-2">
            {requests.map((req) => (
              <div key={req._id} className="rounded-lg border border-border bg-card px-4 py-3 space-y-2.5">
                {/* User + status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold font-mono truncate">{req.userPhone}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={req.status} />
                    {req.isInstant && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30 bg-primary/5">
                        <Zap className="size-2.5" /> Instant
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Amount + date */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold">KES {req.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">{formatDate(req.requestedAt)}</span>
                </div>
                {req.rejectionReason && (
                  <p className="text-[11px] text-rose-500">{req.rejectionReason}</p>
                )}
                {/* Actions */}
                <div className="flex items-center gap-2 pt-0.5">
                  {req.status === "pending" ? (
                    <>
                      <Button
                        variant="outline" size="sm"
                        className="flex-1 h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
                        disabled={approvingId === req._id}
                        onClick={() => handleApprove(req)}
                      >
                        {approvingId === req._id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                        Approve
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="flex-1 h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRejectTarget(req)}
                      >
                        <Ban className="size-3" /> Reject
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary px-0" onClick={() => setDetailTarget(req)}>
                      View details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Desktop table (≥ sm) ── */}
        {!isLoading && requests.length > 0 && (
          <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="h-9 px-4 font-semibold text-xs text-foreground">User</th>
                  <th className="h-9 px-4 font-semibold text-xs text-foreground">Amount</th>
                  <th className="h-9 px-4 font-semibold text-xs text-foreground">Requested</th>
                  <th className="h-9 px-4 font-semibold text-xs text-foreground">Status</th>
                  <th className="h-9 px-4 font-semibold text-xs text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold cursor-pointer" onClick={() => setDetailTarget(req)}>{req.userPhone}</td>
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold cursor-pointer" onClick={() => setDetailTarget(req)}>KES {req.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap cursor-pointer" onClick={() => setDetailTarget(req)}>{formatDate(req.requestedAt)}</td>
                    <td className="py-2.5 px-4 cursor-pointer" onClick={() => setDetailTarget(req)}>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={req.status} />
                        {req.isInstant && (
                          <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30 bg-primary/5">
                            <Zap className="size-2.5" /> Instant
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2.5 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/10"
                            disabled={approvingId === req._id}
                            onClick={() => handleApprove(req)}
                          >
                            {approvingId === req._id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2.5 text-[11px] gap-1 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRejectTarget(req)}
                          >
                            <Ban className="size-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-primary cursor-pointer hover:underline" onClick={() => setDetailTarget(req)}>
                          View
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more */}
        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => loadMore(PAGE_SIZE)}>
              Load More
            </Button>
          </div>
        )}
      </div>

      <DetailModal
        request={detailTarget}
        open={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        onApprove={handleApprove}
        onReject={(req) => setRejectTarget(req)}
        approvingId={approvingId}
      />
      <RejectModal
        request={rejectTarget}
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        adminUserId={user?._id}
      />
    </AdminLayout>
  )
}
