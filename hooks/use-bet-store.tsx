"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"

export interface Selection {
  id: string          // unique identifier, e.g., matchId-outcome
  matchId: string
  matchName: string
  team1: string
  team2: string
  market: string      // e.g. "Full Time"
  selection: "1" | "X" | "2"
  selectionName: string // e.g. team name or "Draw"
  odds: number
}

export interface PlacedBet {
  id: string
  time: string
  selections: Selection[]
  totalOdds: number
  stake: number
  potentialReturn: number
  status: "active" | "won" | "lost"
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
  deposit: (amount: number, phone: string) => Promise<boolean>
  withdraw: (amount: number) => Promise<boolean>
  placeBet: (stake: number) => boolean
  login: (username: string) => void
  logout: () => void
  setActiveTab: (tab: string) => void
  setSearchQuery: (query: string) => void
  setSelectedSport: (sport: string) => void
  setSelectedLeague: (league: string) => void
  settleAllBets: () => void
  adminStats: AdminStats
  updateAdminTransactionStatus: (txId: string, status: "success" | "pending" | "failed", errorDetail?: string) => void
  addNewUserCount: () => void
  settleSingleBet: (betId: string, status: "won" | "lost") => void
}

const BetStoreContext = React.createContext<BetStoreContextType | undefined>(undefined)

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-9A8B7C",
    type: "deposit",
    amount: 6000,
    phone: "+254758757558",
    time: "16 Jun, 10:31",
    status: "failed",
    errorDetail: "Request Cancelled by user."
  },
  {
    id: "TX-5D4E6F",
    type: "deposit",
    amount: 6000,
    phone: "+254111280402",
    time: "16 Jun, 10:19",
    status: "pending"
  },
  {
    id: "TX-1A2B3C",
    type: "deposit",
    amount: 500,
    phone: "+254710552082",
    time: "16 Jun, 10:17",
    status: "failed",
    errorDetail: "No response from user."
  },
  {
    id: "TX-8F7E6D",
    type: "deposit",
    amount: 500,
    phone: "+254710552082",
    time: "16 Jun, 10:16",
    status: "failed",
    errorDetail: "Request Cancelled by user."
  },
  {
    id: "TX-3C2B1A",
    type: "deposit",
    amount: 750,
    phone: "+254715546127",
    time: "16 Jun, 08:19",
    status: "failed",
    errorDetail: "The balance is insufficient for the transaction."
  },
  {
    id: "TX-SUCC1",
    type: "deposit",
    amount: 100000,
    phone: "+254700000000",
    time: "15 Jun, 14:20",
    status: "success"
  },
  {
    id: "TX-SUCC2",
    type: "deposit",
    amount: 31860,
    phone: "+254711111111",
    time: "15 Jun, 18:30",
    status: "success"
  },
  {
    id: "TX-SUCC3",
    type: "deposit",
    amount: 13000,
    phone: "+254722222222",
    time: "15 Jun, 21:05",
    status: "success"
  }
]

export function BetStoreProvider({ children }: { children: React.ReactNode }) {
  const [betslip, setBetslip] = React.useState<Selection[]>([])
  const [walletBalance, setWalletBalance] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bet_wallet_balance")
      if (stored) return parseFloat(stored)
    }
    return 1000
  })
  const [myBets, setMyBets] = React.useState<PlacedBet[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bet_my_bets")
      if (stored) return JSON.parse(stored)
    }
    return []
  })
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bet_transactions")
      if (stored) return JSON.parse(stored)
    }
    return SEED_TRANSACTIONS
  })
  const convexUser = useQuery(api.users.currentUser)
  const { signOut } = useAuthActions()

  const user = React.useMemo(() => {
    if (!convexUser) return null
    return { username: convexUser.name || convexUser.phone || "User" }
  }, [convexUser])

  const [activeTab, setActiveTabState] = React.useState<string>("home")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedSport, setSelectedSport] = React.useState<string>("all")
  const [selectedLeague, setSelectedLeague] = React.useState<string>("All Leagues")

  const [adminStats, setAdminStats] = React.useState<AdminStats>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bet_admin_stats")
      if (stored) return JSON.parse(stored)
    }
    return {
      totalUsers: 311,
      totalDeposits: 144860,
      activeBets: 53
    }
  })

  // Sync state helpers
  const saveBalance = (newBalance: number) => {
    setWalletBalance(newBalance)
    localStorage.setItem("bet_wallet_balance", newBalance.toString())
  }

  const saveBets = (newBets: PlacedBet[]) => {
    setMyBets(newBets)
    localStorage.setItem("bet_my_bets", JSON.stringify(newBets))
  }

  const saveTx = (newTx: Transaction[]) => {
    setTransactions(newTx)
    localStorage.setItem("bet_transactions", JSON.stringify(newTx))
  }

  const saveAdminStats = (newStats: AdminStats) => {
    setAdminStats(newStats)
    localStorage.setItem("bet_admin_stats", JSON.stringify(newStats))
  }

  const addNewUserCount = () => {
    saveAdminStats({
      ...adminStats,
      totalUsers: adminStats.totalUsers + 1
    })
  }

  const login = (_username: string) => {
    // Handled by Convex Auth
  }

  const logout = async () => {
    await signOut()
    setBetslip([])
  }

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab)
    if (tab !== "home" && !tab.startsWith("sport-")) {
      setSelectedSport("all")
      setSelectedLeague("All Leagues")
    }
  }

  const addToBetslip = (selection: Selection) => {
    setBetslip((prev) => {
      // 1. If identical selection exists, toggle/remove it
      const exists = prev.find((item) => item.id === selection.id)
      if (exists) {
        return prev.filter((item) => item.id !== selection.id)
      }

      // 2. If same match selection exists with a different outcome, replace it
      const matchExists = prev.find((item) => item.matchId === selection.matchId)
      if (matchExists) {
        return prev.map((item) => (item.matchId === selection.matchId ? selection : item))
      }

      // 3. Otherwise add new selection
      return [...prev, selection]
    })
  }

  const removeFromBetslip = (id: string) => {
    setBetslip((prev) => prev.filter((item) => item.id !== id))
  }

  const clearBetslip = () => {
    setBetslip([])
  }

  const deposit = async (amount: number, phone: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const newBalance = walletBalance + amount
    saveBalance(newBalance)

    const newTx: Transaction = {
      id: "TX-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: "deposit",
      amount,
      phone,
      time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "success",
    }
    
    saveTx([newTx, ...transactions])
    
    // Update admin stats deposits
    saveAdminStats({
      ...adminStats,
      totalDeposits: adminStats.totalDeposits + amount
    })
    
    return true
  }

  const withdraw = async (amount: number): Promise<boolean> => {
    if (amount > walletBalance) return false
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const newBalance = walletBalance - amount
    saveBalance(newBalance)

    const newTx: Transaction = {
      id: "TX-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: "withdrawal",
      amount,
      time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "success",
    }
    saveTx([newTx, ...transactions])
    return true
  }

  const placeBet = (stake: number): boolean => {
    if (stake <= 0 || betslip.length === 0) return false
    if (stake > walletBalance) return false

    const newBalance = walletBalance - stake
    saveBalance(newBalance)

    const totalOdds = parseFloat(
      betslip.reduce((acc, sel) => acc * sel.odds, 1).toFixed(2)
    )

    const newBet: PlacedBet = {
      id: "BET-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      selections: [...betslip],
      totalOdds,
      stake,
      potentialReturn: parseFloat((stake * totalOdds).toFixed(2)),
      status: "active",
    }

    saveBets([newBet, ...myBets])
    setBetslip([])
    
    // Update active bets in admin stats
    saveAdminStats({
      ...adminStats,
      activeBets: adminStats.activeBets + 1
    })

    return true
  }

  const settleSingleBet = (betId: string, status: "won" | "lost") => {
    const updated = myBets.map((bet) => {
      if (bet.id === betId) {
        return { ...bet, status }
      }
      return bet
    })
    saveBets(updated)
    
    // Decrement active bets
    saveAdminStats({
      ...adminStats,
      activeBets: Math.max(0, adminStats.activeBets - 1)
    })
  }

  const settleAllBets = () => {
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
    
    // Decrement active bets by settled count
    saveAdminStats({
      ...adminStats,
      activeBets: Math.max(0, adminStats.activeBets - settledCount)
    })
  }

  const updateAdminTransactionStatus = (txId: string, status: "success" | "pending" | "failed", errorDetail?: string) => {
    const updated = transactions.map((t) => {
      if (t.id === txId) {
        // If it transitions to success, credit total deposits
        if (status === "success" && t.status !== "success" && t.type === "deposit") {
          saveAdminStats({
            ...adminStats,
            totalDeposits: adminStats.totalDeposits + t.amount
          })
        }
        return { ...t, status, errorDetail }
      }
      return t
    })
    saveTx(updated)
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
        deposit,
        withdraw,
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
