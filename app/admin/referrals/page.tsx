"use client"

import React, { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthClient } from "@/lib/auth-client"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  Wallet,
  ClipboardCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

interface ReferralData {
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

interface ReferrerDetail {
  referrerId: string
  phone: string
  name: string
  referralCount: number
  totalEarnings: number
}

export default function AdminReferralsPage() {
  const { user } = useAuthClient()
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerDetail | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const PAGE_SIZE = 25

  // Queries
  const referralSummary = useQuery(
    api.referrals.getReferralSummary,
    user?._id ? { userId: user._id } : "skip"
  )

  const referralTrends = useQuery(
    api.referrals.getReferralTrends,
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

  // Filter displayed referrals based on search
  const filteredReferrals = React.useMemo(() => {
    if (!allReferrals?.referrals) return []
    if (!searchQuery) return allReferrals.referrals

    const query = searchQuery.toLowerCase()
    return allReferrals.referrals.filter(
      (r) =>
        r.referrerPhone?.toLowerCase().includes(query) ||
        r.referrerName?.toLowerCase().includes(query) ||
        r.referredUserPhone?.toLowerCase().includes(query) ||
        r.referredUserName?.toLowerCase().includes(query)
    )
  }, [allReferrals?.referrals, searchQuery])

  const handleViewDetails = (referrer: ReferrerDetail) => {
    setSelectedReferrer(referrer)
    setIsDetailDialogOpen(true)
  }

  if (!user) {
    return (
      <AdminLayout pageTitle="Referrals">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  const isLoading = !referralSummary || !allReferrals

  return (
    <AdminLayout pageTitle="Referrals">
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto bg-background">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-xs text-muted-foreground">
            Track all referrals, earnings, and referrer performance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{referralSummary?.totalReferrals ?? 0}</p>
              )}
              {referralSummary && (
                <p className="text-xs text-muted-foreground mt-1">
                  {referralSummary.completedReferrals} completed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Completed Referrals */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <ClipboardCheck className="size-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {referralSummary?.completedReferrals ?? 0}
                </p>
              )}
              {referralSummary && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    ((referralSummary.completedReferrals ?? 0) / (referralSummary.totalReferrals || 1)) *
                    100
                  ).toFixed(1)}
                  % conversion
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Referrals */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="size-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold text-amber-600">
                  {referralSummary?.pendingReferrals ?? 0}
                </p>
              )}
              {referralSummary && (
                <p className="text-xs text-muted-foreground mt-1">Awaiting signup</p>
              )}
            </CardContent>
          </Card>

          {/* Total Earnings Awarded */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Awarded</CardTitle>
                <Wallet className="size-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-emerald-600">
                  KES {(referralSummary?.totalEarningsAwarded ?? 0).toLocaleString()}
                </p>
              )}
              {referralSummary?.completedReferrals && (
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: KES {Math.round(referralSummary.averageReward).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all-referrals" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all-referrals">All Referrals</TabsTrigger>
            <TabsTrigger value="top-referrers">Top Referrers</TabsTrigger>
          </TabsList>

          {/* All Referrals Tab */}
          <TabsContent value="all-referrals" className="space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-4 border-b border-border">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">All Referrals</CardTitle>
                    <CardDescription className="text-xs">
                      View and manage all referral activities
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Search phone..."
                        className="pl-8 h-9 text-sm w-full sm:w-48"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setCurrentPage(0)
                        }}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value as "all" | "pending" | "completed")
                        setCurrentPage(0)
                      }}
                    >
                      <SelectTrigger className="h-9 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                  </div>
                ) : filteredReferrals.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No referrals found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery ? "Try adjusting your search" : "Referrals will appear here"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-xs font-semibold">Referrer</TableHead>
                            <TableHead className="text-xs font-semibold">Referred User</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Reward</TableHead>
                            <TableHead className="text-xs font-semibold">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReferrals.map((referral) => (
                            <TableRow key={referral._id} className="border-border hover:bg-muted/40">
                              <TableCell className="text-xs">
                                <div className="flex flex-col gap-0.5">
                                  <p className="font-medium text-foreground">{referral.referrerName}</p>
                                  <p className="text-muted-foreground font-mono text-[11px]">
                                    {referral.referrerPhone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex flex-col gap-0.5">
                                  <p className="font-medium text-foreground">{referral.referredUserName}</p>
                                  <p className="text-muted-foreground font-mono text-[11px]">
                                    {referral.referredUserPhone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={referral.status === "completed" ? "default" : "secondary"}
                                  className={
                                    referral.status === "completed"
                                      ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                      : "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                                  }
                                >
                                  {referral.status === "completed" ? "Completed" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right font-semibold text-foreground">
                                KES {referral.amountEarned.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                <div className="flex flex-col gap-0.5">
                                  <p>{referral.createdDate}</p>
                                  {referral.completedDate && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Completed: {referral.completedDate}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
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
                          className="h-8 gap-1"
                        >
                          <ChevronLeft className="size-3.5" />
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
                          className="h-8 gap-1"
                        >
                          Next
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Referrers Tab */}
          <TabsContent value="top-referrers" className="space-y-4">
            <Card className="border border-border">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-lg">Top Referrers</CardTitle>
                <CardDescription className="text-xs">
                  Users with the most successful referrals
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                ) : !referralSummary?.topReferrers || referralSummary.topReferrers.length === 0 ? (
                  <div className="py-12 text-center">
                    <TrendingUp className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No referrers yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralSummary.topReferrers.map((referrer, index) => (
                      <div
                        key={referrer.referrerId}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(referrer)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{referrer.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{referrer.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Referrals</p>
                            <p className="text-lg font-bold text-foreground">
                              {referrer.referralCount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Earnings</p>
                            <p className="text-lg font-bold text-emerald-600">
                              KES {referrer.totalEarnings.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Referral Trends Card */}
        {referralTrends && referralTrends.length > 0 && (
          <Card className="border border-border">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg">Referral Trends (30 Days)</CardTitle>
              <CardDescription className="text-xs">
                Referrals created and completed over time
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="space-y-2">
                {referralTrends.map((trend) => {
                  const maxCount = Math.max(
                    ...referralTrends.map((t) => Math.max(t.created, t.completed)),
                    1
                  )
                  return (
                    <div key={trend.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{trend.date}</span>
                        <span className="text-foreground font-semibold">
                          Created: {trend.created} | Completed: {trend.completed}
                        </span>
                      </div>
                      <div className="flex gap-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 rounded-full"
                          style={{ width: `${(trend.created / maxCount) * 50}%` }}
                        />
                        <div
                          className="bg-green-500 rounded-full"
                          style={{ width: `${(trend.completed / maxCount) * 50}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Referrer Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referrer Performance</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedReferrer?.name} ({selectedReferrer?.phone})
            </DialogDescription>
          </DialogHeader>

          {selectedReferrer && (
            <ReferrerDetailsView
              referrerId={selectedReferrer.referrerId as any}
              userId={user._id}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

// Component to display referrer details
function ReferrerDetailsView({
  referrerId,
  userId,
}: {
  referrerId: string
  userId: string
}) {
  const referrerPerformance = useQuery(
    api.referrals.getReferrerPerformance,
    {
      userId: userId as any,
      referrerId: referrerId as any,
    }
  )

  if (!referrerPerformance) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
          <p className="text-2xl font-bold">{referrerPerformance.totalReferrals}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {referrerPerformance.completedCount}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold">{referrerPerformance.conversionRate}%</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-emerald-600">
            KES {referrerPerformance.totalEarnings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Referral Details Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/40 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Referral Details</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/20">
              <TableHead className="text-xs">Referred User</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrerPerformance.referralDetails.map((referral) => (
              <TableRow key={referral._id} className="border-border">
                <TableCell className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium">{referral.referredUserPhone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={referral.status === "completed" ? "default" : "secondary"}
                    className={
                      referral.status === "completed"
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs"
                    }
                  >
                    {referral.status === "completed" ? "✓ Done" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-semibold">
                  KES {referral.amountEarned.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    <p>{referral.createdDate}</p>
                    {referral.completedDate && (
                      <p className="text-[10px]">Completed: {referral.completedDate}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
