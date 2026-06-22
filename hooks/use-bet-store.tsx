"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export interface Selection {
  id: string          // unique identifier, e.g., matchId-outcome
  matchId: string
  matchName: string
  team1: string
  team2: string
  market: string      // e.g. "Full Time"
  selection: string
  selectionName: string // e.g. team name or "Draw"
  odds: number
  sourceOddId?: string
  marketKey?: string
  marketName?: string
  outcomeName?: string
  specifiers?: string
  matchStartTime?: number
}

export interface PlacedBet {
  id: string
  time: string
  placedAt?: number
  selections: Selection[]
  totalOdds: number
  stake: number
  potentialReturn: number
  status: "active" | "won" | "lost" | "cancelled"
}

export interface Transaction {
  id: string
  type: "deposit" | "withdrawal"
  amount: number
  phone?: string
  time: string
  status: "success" | "pending" | "failed"
  errorDetail?: string
}

export interface AdminStats {
  totalUsers: number
  totalDeposits: number
  activeBets: number
}

interface BetStoreContextType {
  betslip: Selection[]
  walletBalance: number
  myBets: PlacedBet[]
  transactions: Transaction[]
  user: { username: string } | null
  activeTab: string
  searchQuery: string
  selectedSport: string // 'all' | 'football' | 'basketball' | 'tennis' | 'american-football'
  selectedLeague: string // e.g. 'All Leagues' | 'Premier League' etc.
  addToBetslip: (selection: Selection) => void
  removeFromBetslip: (id: string) => void
  clearBetslip: () => void
  placeBet: (stake: number) => Promise<boolean> | boolean
  login: () => void
  logout: () => void
  setActiveTab: (tab: string) => void
  setSearchQuery: (query: string) => void
  setSelectedSport: (sport: string) => void
  setSelectedLeague: (league: string) => void
  settleAllBets: () => void | Promise<void>
  adminStats: AdminStats
  updateAdminTransactionStatus: (txId: string, status: "success" | "pending" | "failed", errorDetail?: string) => void | Promise<void>
  addNewUserCount: () => void
  settleSingleBet: (betId: string, status: "won" | "lost") => void | Promise<void>
  cancelBet: (betId: string) => Promise<boolean>
}

const BetStoreContext = React.createContext<BetStoreContextType | undefined>(undefined)



export function BetStoreProvider({ children }: { children: React.ReactNode }) {
  const [betslip, setBetslipState] = React.useState<Selection[]>([])
  const [localBalance, setLocalBalance] = React.useState<number>(0)
  const [localBets, setLocalBets] = React.useState<PlacedBet[]>([])
  const [localTransactions, setLocalTransactions] = React.useState<Transaction[]>([])

  // Convex reactive queries - use undefined to skip
  const dbBalance = useQuery(api.bets.getWalletBalance)
  const dbBets = useQuery(api.bets.getMyBets)
  const dbTransactions = useQuery(api.bets.getTransactions)
  const dbAdminStats = useQuery(api.bets.getAdminStats)

  // Convex mutations
  const placeBetMutation = useMutation(api.bets.placeBet)
  const settleSingleBetMutation = useMutation(api.bets.settleSingleBet)
  const settleAllBetsMutation = useMutation(api.bets.settleAllBets)
  const cancelBetMutation = useMutation(api.bets.cancelBet)
  const updateTransactionStatusMutation = useMutation(api.bets.updateTransactionStatus)

  const user = React.useMemo(() => {
    return { username: "User" }
  }, [])

  const [activeTab, setActiveTabState] = React.useState<string>("home")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedSport, setSelectedSport] = React.useState<string>("all")
  const [selectedLeague, setSelectedLeague] = React.useState<string>("All Leagues")

  // Dynamic balance, bets, transactions, and adminStats
  const walletBalance: number = dbBalance ?? 0
  const myBets: PlacedBet[] = (dbBets as PlacedBet[] | undefined) ?? []
  const transactions: Transaction[] = (dbTransactions as Transaction[] | undefined) ?? []
  const adminStats = (dbAdminStats as AdminStats | undefined) ?? {
    totalUsers: 0,
    totalDeposits: 0,
    activeBets: 0,
  }

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const balance = localStorage.getItem("bet_wallet_balance")
      if (balance) {
        const parsed = parseFloat(balance)
        if (!isNaN(parsed)) setLocalBalance(parsed)
      }

      const bets = localStorage.getItem("bet_my_bets")
      if (bets) {
        try {
          setLocalBets(JSON.parse(bets))
        } catch (e) {
          console.error(e)
        }
      }

      const txs = localStorage.getItem("bet_transactions")
      if (txs) {
        try {
          setLocalTransactions(JSON.parse(txs))
        } catch (e) {
          console.error(e)
        }
      }

      const slip = localStorage.getItem("bet_betslip")
      if (slip) {
        try {
          setBetslipState(JSON.parse(slip))
        } catch (e) {
          console.error(e)
        }
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === "bet_wallet_balance" && e.newValue) {
        setLocalBalance(parseFloat(e.newValue))
      }
      if (e.key === "bet_my_bets" && e.newValue) {
        setLocalBets(JSON.parse(e.newValue))
      }
      if (e.key === "bet_transactions" && e.newValue) {
        setLocalTransactions(JSON.parse(e.newValue))
      }
      if (e.key === "bet_betslip" && e.newValue) {
        setBetslipState(JSON.parse(e.newValue))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Sync state helpers
  const saveBalance = (newBalance: number) => {
    setLocalBalance(newBalance)
    localStorage.setItem("bet_wallet_balance", newBalance.toString())
  }

  const saveBets = (newBets: PlacedBet[]) => {
    setLocalBets(newBets)
    localStorage.setItem("bet_my_bets", JSON.stringify(newBets))
  }

  const saveTx = (newTx: Transaction[]) => {
    setLocalTransactions(newTx)
    localStorage.setItem("bet_transactions", JSON.stringify(newTx))
  }

  const addNewUserCount = () => {
    // No longer needed - user count comes from real database queries
  }

  const login = () => {
    // Handled by Convex Auth
  }

  const logout = async () => {
    setBetslipState([])
    localStorage.setItem("bet_betslip", JSON.stringify([]))
  }

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab)
    if (tab !== "home" && !tab.startsWith("sport-")) {
      setSelectedSport("all")
      setSelectedLeague("All Leagues")
    }
  }

  const addToBetslip = (selection: Selection) => {
    let next: Selection[]
    const exists = betslip.find((item) => item.id === selection.id)
    if (exists) {
      next = betslip.filter((item) => item.id !== selection.id)
    } else {
      const matchExists = betslip.find((item) => item.matchId === selection.matchId)
      if (matchExists) {
        next = betslip.map((item) => (item.matchId === selection.matchId ? selection : item))
      } else {
        next = [...betslip, selection]
      }
    }
    setBetslipState(next)
    localStorage.setItem("bet_betslip", JSON.stringify(next))
  }

  const removeFromBetslip = (id: string) => {
    const next = betslip.filter((item) => item.id !== id)
    setBetslipState(next)
    localStorage.setItem("bet_betslip", JSON.stringify(next))
  }

  const clearBetslip = () => {
    setBetslipState([])
    localStorage.setItem("bet_betslip", JSON.stringify([]))
  }

  const placeBet = async (stake: number): Promise<boolean> => {
    if (stake <= 0 || betslip.length === 0) return false
    const totalRequired = stake * betslip.length
    if (totalRequired > walletBalance) return false

    try {
      for (const sel of betslip) {
        const totalOdds = sel.odds
        const potentialReturn = parseFloat((stake * totalOdds).toFixed(2))
        const result = await placeBetMutation({
          selections: [
            {
              id: sel.id,
              matchId: sel.matchId,
              matchName: sel.matchName,
              team1: sel.team1,
              team2: sel.team2,
              market: sel.market,
              selection: sel.selection,
              selectionName: sel.selectionName,
              odds: sel.odds,
              sourceOddId: sel.sourceOddId,
              marketKey: sel.marketKey,
              marketName: sel.marketName,
              outcomeName: sel.outcomeName,
              specifiers: sel.specifiers,
              matchStartTime: sel.matchStartTime,
            },
          ],
          totalOdds,
          stake,
          potentialReturn,
        })
        if (!result.success) {
          return false
        }
      }
      setBetslipState([])
      localStorage.setItem("bet_betslip", JSON.stringify([]))
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const settleSingleBet = async (betId: string, status: "won" | "lost") => {
    try {
      await settleSingleBetMutation({ betId: betId as any, status })
    } catch (err) {
      console.error(err)
    }

    const updated = myBets.map((bet) => {
      if (bet.id === betId) {
        return { ...bet, status }
      }
      return bet
    })
    saveBets(updated)
    // Admin stats will update automatically from real database query
  }

  const settleAllBets = async () => {
    try {
      await settleAllBetsMutation()
    } catch (err) {
      console.error(err)
    }

    let settledCount = 0
    const updated = myBets.map((bet) => {
      if (bet.status !== "active") return bet
      settledCount++
      const won = Math.random() > 0.4
      return {
        ...bet,
        status: won ? ("won" as const) : ("lost" as const),
      }
    })
    saveBets(updated)
    // Admin stats will update automatically from real database query
  }

  const updateAdminTransactionStatus = async (txId: string, status: "success" | "pending" | "failed", errorDetail?: string) => {
    try {
      await updateTransactionStatusMutation({ txId, status, errorDetail })
    } catch (err) {
      console.error(err)
    }

    const updated = transactions.map((t) => {
      if (t.id === txId) {
        return { ...t, status, errorDetail }
      }
      return t
    })
    saveTx(updated)
    // Admin stats will update automatically from real database query
  }

  const cancelBet = async (betId: string): Promise<boolean> => {
    try {
      await cancelBetMutation({ betId: betId as any })
      return true
    } catch (err) {
      console.error(err)
    }

    const bet = myBets.find((b) => b.id === betId)
    if (!bet || bet.status !== "active") return false

    const startTimes = bet.selections
      .map((s) => s.matchStartTime)
      .filter((t): t is number => typeof t === "number" && t > 0)
    if (startTimes.length === 0) return false

    const cancelDeadline = Math.min(...startTimes) - 5 * 60 * 1000
    if (Date.now() >= cancelDeadline) return false

    saveBalance(walletBalance + bet.stake)
    saveBets(
      myBets.map((b) =>
        b.id === betId ? { ...b, status: "cancelled" as const } : b
      )
    )
    // Admin stats will update automatically from real database query
    return true
  }

  return (
    <BetStoreContext.Provider
      value={{
        betslip,
        walletBalance,
        myBets,
        transactions,
        user,
        activeTab,
        searchQuery,
        selectedSport,
        selectedLeague,
        addToBetslip,
        removeFromBetslip,
        clearBetslip,
        placeBet,
        login,
        logout,
        setActiveTab,
        setSearchQuery,
        setSelectedSport,
        setSelectedLeague,
        settleAllBets,
        adminStats,
        updateAdminTransactionStatus,
        addNewUserCount,
        settleSingleBet,
        cancelBet,
      }}
    >
      {children}
    </BetStoreContext.Provider>
  )
}

export function useBetStore() {
  const context = React.useContext(BetStoreContext)
  if (context === undefined) {
    throw new Error("useBetStore must be used within a BetStoreProvider")
  }
  return context
}
