"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthClient } from "@/lib/auth-client"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  Users,
  TrendingUp,
  Wallet,
  ChevronRight,
  Eye,
  Filter,
} from "lucide-react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Id } from "@/convex/_generated/dataModel"

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralData = {
  _id: string
  status: "pending" | "completed"
  amountEarned: number
  createdDate: string
  completedDate: string | null
  referrerPhone?: string
  referrerName?: string
  referredUserPhone: string
  referredUserName?: string
  referredUserRole?: string
}

type ReferrerDetail = {
  referrerId: string
  phone: string
  name: string
  referralCount: number
  totalEarnings: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "pending" | "completed" }) {
  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
      >
        Completed
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10"
    >
      Pending
    </Badge>
  )
}

// ─── Referrer Details Modal ───────────────────────────────────────────────────

interface ReferrerDetailsModalProps {
  referrer: ReferrerDetail | null
  open: boolean
  onClose: () => void
  userId: string
}

function ReferrerDetailsModal({
  referrer,
  open,
  onClose,
  userId,
}: ReferrerDetailsModalProps) {
  const referrerPerformance = useQuery(
    api.referrals.getReferrerPerformance,
    referrer
      ? {
        userId: userId as Id<"users">,
        referrerId: referrer.referrerId as Id<"users">,
      }
      : "skip"
  )

  if (!referrer) return null

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Referrer Performance"
      description={`${referrer.name} (${referrer.phone})`}
    >
      <div className="space-y-4 py-2 text-xs">
        {!referrerPerformance ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-border rounded-lg p-2.5 space-y-1 bg-muted/30">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Total Referrals
                </span>
                <p className="text-lg font-bold tracking-tight font-mono">
                  {referrerPerformance.totalReferrals}
                </p>
              </div>

              <div className="border border-border rounded-lg p-2.5 space-y-1 bg-muted/30">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Completed
                </span>
                <p className="text-lg font-bold tracking-tight font-mono text-emerald-600">
                  {referrerPerformance.completedCount}
                </p>
              </div>

              <div className="border border-border rounded-lg p-2.5 space-y-1 bg-muted/30">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Conversion Rate
                </span>
                <p className="text-lg font-bold tracking-tight font-mono">
                  {referrerPerformance.conversionRate}%
                </p>
              </div>

              <div className="border border-border rounded-lg p-2.5 space-y-1 bg-muted/30">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Total Earnings
                </span>
                <p className="text-lg font-bold tracking-tight font-mono text-emerald-600">
                  KES {referrerPerformance.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            <Separator />

            {/* Referral Details Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[360px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <th className="py-2.5 px-3">Referred User</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referrerPerformance.referralDetails.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No referrals
                        </td>
                      </tr>
                    ) : (
                      referrerPerformance.referralDetails.map((referral) => (
                        <tr
                          key={referral._id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold font-mono text-foreground max-w-[140px] truncate">
                            {referral.referredUserPhone}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={referral.status} />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            KES {referral.amountEarned.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              <p>{referral.createdDate}</p>
                              {referral.completedDate && (
                                <p className="text-[9px]">
                                  Completed: {referral.completedDate}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsiveModal>
  )
}

// ─── Main Referrals Panel ─────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function AdminReferralsPage() {
  const { user } = useAuthClient()
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "completed">(
    "all"
  )
  const [currentPage, setCurrentPage] = React.useState(0)
  const [selectedReferrer, setSelectedReferrer] = React.useState<ReferrerDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  // Queries
  const referralSummary = useQuery(
    api.referrals.getReferralSummary,
    user?._id ? { userId: user._id } : "skip"
  )

  const allReferrals = useQuery(
    api.referrals.getAllReferrals,
    user?._id
      ? {
        userId: user._id,
        status: statusFilter,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      }
      : "skip"
  )

  // Display all referrals from the query
  const filteredReferrals = React.useMemo(() => {
    return allReferrals?.referrals ?? []
  }, [allReferrals?.referrals])

  const handleViewDetails = (referrer: ReferrerDetail) => {
    setSelectedReferrer(referrer)
    setIsDetailOpen(true)
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  const isLoading = !referralSummary || !allReferrals

  return (
    <AdminLayout pageTitle="Referrals">
      <div className="space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Referral Program
            </h1>
            <p className="text-xs text-muted-foreground">
              Track all referrals and referrer performance.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" /> Total Referrals
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono">
                {referralSummary?.totalReferrals ?? 0}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-500" /> Completed
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-emerald-600">
                {referralSummary?.completedReferrals ?? 0}
              </p>
            )}
          </div>

          <div className="border border-border rounded-lg p-3.5 space-y-1 bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Wallet className="size-3.5 text-blue-500" /> Total Awarded
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-bold tracking-tight font-mono text-blue-600">
                KES {(referralSummary?.totalEarningsAwarded ?? 0).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* All Referrals Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold tracking-tight">All Referrals</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Filter className="size-3" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("all")
                    setCurrentPage(0)
                  }}
                  className={
                    statusFilter === "all" ? "bg-primary/10 text-primary" : ""
                  }
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("completed")
                    setCurrentPage(0)
                  }}
                  className={
                    statusFilter === "completed"
                      ? "bg-primary/10 text-primary"
                      : ""
                  }
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter("pending")
                    setCurrentPage(0)
                  }}
                  className={
                    statusFilter === "pending" ? "bg-primary/10 text-primary" : ""
                  }
                >
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="sm:hidden space-y-2">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {!isLoading && filteredReferrals.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No referrals found.
              </div>
            )}

            {filteredReferrals.map((referral) => (
              <div
                key={referral._id}
                className="rounded-lg border border-border bg-card p-3 space-y-2.5 cursor-pointer hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold font-mono text-foreground truncate">
                      {referral.referrerName}
                    </span>
                  </div>
                  <StatusBadge status={referral.status} />
                </div>

                <div className="space-y-1 text-[11px]">
                  <p className="text-muted-foreground">
                    Referred: {referral.referredUserPhone}
                  </p>
                  <p className="text-muted-foreground">{referral.createdDate}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    KES {referral.amountEarned.toLocaleString()}
                  </p>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (≥ sm) */}
          <div className="hidden sm:block rounded-lg border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Referrer</th>
                    <th className="py-3 px-4">Referred User</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Reward</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="py-8">
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredReferrals.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-muted-foreground text-xs"
                      >
                        No referrals found.
                      </td>
                    </tr>
                  )}

                  {filteredReferrals.map((referral) => (
                    <tr key={referral._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold font-mono text-foreground max-w-[140px] truncate">
                        {referral.referrerPhone}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground max-w-[140px] truncate">
                        {referral.referredUserPhone}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {referral.createdDate}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={referral.status} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-right text-foreground">
                        KES {referral.amountEarned.toLocaleString()}
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
                              onClick={() => {
                                // View referrer details
                                if (referralSummary?.topReferrers) {
                                  const referrer = referralSummary.topReferrers.find(
                                    (r) => r.phone === referral.referrerPhone
                                  )
                                  if (referrer) {
                                    handleViewDetails(referrer)
                                  }
                                }
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="size-3.5 text-muted-foreground" />
                              View Referrer Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!isLoading && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {currentPage * PAGE_SIZE + 1} to{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, allReferrals?.total ?? 0)} of{" "}
                {allReferrals?.total ?? 0}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        currentPage + 1,
                        Math.ceil((allReferrals?.total ?? 0) / PAGE_SIZE) - 1
                      )
                    )
                  }
                  disabled={!allReferrals?.hasMore}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Top Referrers Section */}
        {referralSummary?.topReferrers && referralSummary.topReferrers.length > 0 && (
          <>
            <Separator />

            <div className="space-y-2.5">
              <h2 className="text-sm font-bold tracking-tight">Top Referrers</h2>

              <div className="space-y-2">
                {referralSummary.topReferrers.map((referrer, idx) => (
                  <div
                    key={referrer.referrerId}
                    className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                    onClick={() => handleViewDetails(referrer)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            {referrer.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {referrer.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0 text-right">
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-muted-foreground">Referrals</p>
                          <p className="text-lg font-bold tracking-tight font-mono">
                            {referrer.referralCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Earnings</p>
                          <p className="text-lg font-bold tracking-tight font-mono text-emerald-600">
                            KES {referrer.totalEarnings.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Referrer Details Modal */}
      <ReferrerDetailsModal
        referrer={selectedReferrer}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        userId={user._id}
      />
    </AdminLayout>
  )
}
