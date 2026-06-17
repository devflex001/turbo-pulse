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
  selection: string
  selectionName: string // e.g. team name or "Draw"
  odds: number
  sourceOddId?: string
  marketKey?: string
  marketName?: string
  outcomeName?: string
  specifiers?: string
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
  placeBet: (stake: number) => boolean
  login: () => void
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
  const [betslip, setBetslipState] = React.useState<Selection[]>([])
  const [walletBalance, setWalletBalance] = React.useState<number>(1000)
  const [myBets, setMyBets] = React.useState<PlacedBet[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>(SEED_TRANSACTIONS)
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

  const [adminStats, setAdminStats] = React.useState<AdminStats>({
    totalUsers: 311,
    totalDeposits: 144860,
    activeBets: 53
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const balance = localStorage.getItem("bet_wallet_balance")
      if (balance) {
        const parsed = parseFloat(balance)
        if (!isNaN(parsed)) setWalletBalance(parsed)
      }

      const bets = localStorage.getItem("bet_my_bets")
      if (bets) {
        try {
          setMyBets(JSON.parse(bets))
        } catch (e) {
          console.error(e)
        }
      }

      const txs = localStorage.getItem("bet_transactions")
      if (txs) {
        try {
          setTransactions(JSON.parse(txs))
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

      const stats = localStorage.getItem("bet_admin_stats")
      if (stats) {
        try {
          setAdminStats(JSON.parse(stats))
        } catch (e) {
          console.error(e)
        }
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === "bet_wallet_balance" && e.newValue) {
        setWalletBalance(parseFloat(e.newValue))
      }
      if (e.key === "bet_my_bets" && e.newValue) {
        setMyBets(JSON.parse(e.newValue))
      }
      if (e.key === "bet_transactions" && e.newValue) {
        setTransactions(JSON.parse(e.newValue))
      }
      if (e.key === "bet_betslip" && e.newValue) {
        setBetslipState(JSON.parse(e.newValue))
      }
      if (e.key === "bet_admin_stats" && e.newValue) {
        setAdminStats(JSON.parse(e.newValue))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

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

  const login = () => {
    // Handled by Convex Auth
  }

  const logout = async () => {
    await signOut()
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
    setBetslipState([])
    localStorage.setItem("bet_betslip", JSON.stringify([]))
    
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
    let balanceToAdd = 0
    const updated = transactions.map((t) => {
      if (t.id === txId) {
        if (status === "success" && t.status !== "success" && t.type === "deposit") {
          saveAdminStats({
            ...adminStats,
            totalDeposits: adminStats.totalDeposits + t.amount
          })
          balanceToAdd = t.amount
        }
        return { ...t, status, errorDetail }
      }
      return t
    })
    saveTx(updated)
    if (balanceToAdd > 0) {
      saveBalance(walletBalance + balanceToAdd)
    }
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
