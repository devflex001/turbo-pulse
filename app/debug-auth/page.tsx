"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, LogOut, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function DebugAuthPage() {
  const { user, isLoading, logout } = useAuth()
  const [localStorageData, setLocalStorageData] = React.useState<Record<string, string>>({})

  const refreshLocalStorage = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const data: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              // Try to parse JSON, otherwise use raw string
              try {
                const parsed = JSON.parse(value)
                data[key] = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
              } catch {
                data[key] = value
              }
            }
          } catch (e) {
            data[key] = '[Cannot read]'
          }
        }
      }
      setLocalStorageData(data)
    }
  }, [])

  React.useEffect(() => {
    refreshLocalStorage()
  }, [refreshLocalStorage])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    refreshLocalStorage()
    toast.success('LocalStorage cleared')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Authentication Debug</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshLocalStorage}
              >
                <RefreshCw className="size-3 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLocalStorage}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Auth State */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Auth Context State</h2>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="size-3 animate-spin mr-1" />
                    Loading...
                  </div>
                )}
                <div className={`px-2 py-1 rounded text-xs font-bold ${user ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {user ? 'LOGGED IN' : 'NOT LOGGED IN'}
                </div>
              </div>
            </div>

            {user ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium text-muted-foreground">User ID:</div>
                  <div className="font-mono text-sm break-all">{user._id}</div>
                  <div className="font-medium text-muted-foreground">Phone:</div>
                  <div className="font-medium">{user.phone}</div>
                  <div className="font-medium text-muted-foreground">Role:</div>
                  <div className={`font-medium ${user.role === 'admin' ? 'text-amber-600' : 'text-foreground'}`}>
                    {user.role}
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logout()}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="size-3 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-border rounded-lg text-muted-foreground">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <p>Loading authentication state...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>No user authenticated</p>
                    <p className="text-sm">Try logging in from the main page first.</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* LocalStorage */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">LocalStorage Contents</h2>
              <div className="text-sm text-muted-foreground">
                {Object.keys(localStorageData).length} items
              </div>
            </div>

            {Object.keys(localStorageData).length === 0 ? (
              <div className="text-center p-6 border border-dashed border-border rounded-lg text-muted-foreground">
                LocalStorage is empty
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(localStorageData).map(([key, value]) => (
                  <div key={key} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-foreground font-mono">{key}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${key}: ${value}`)}
                        className="h-6 px-2"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                      {value.length > 500 ? `${value.substring(0, 500)}... [${value.length - 500} more chars]` : value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Key Checks */}
          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Key Authentication Checks</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">betflow_session_token</span>
                <div className={`px-2 py-1 rounded text-xs font-bold ${localStorageData['betflow_session_token'] ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {localStorageData['betflow_session_token'] ? 'PRESENT' : 'MISSING'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">betflow_session_user</span>
                <div className={`px-2 py-1 rounded text-xs font-bold ${localStorageData['betflow_session_user'] ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {localStorageData['betflow_session_user'] ? 'PRESENT' : 'MISSING'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">convex_auth_token (legacy)</span>
                <div className={`px-2 py-1 rounded text-xs font-bold ${localStorageData['convex_auth_token'] ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                  {localStorageData['convex_auth_token'] ? 'PRESENT' : 'MISSING'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">convex_auth_user (legacy)</span>
                <div className={`px-2 py-1 rounded text-xs font-bold ${localStorageData['convex_auth_user'] ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                  {localStorageData['convex_auth_user'] ? 'PRESENT' : 'MISSING'}
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Debug Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const token = localStorage.getItem('betflow_session_token')
                  if (token) {
                    copyToClipboard(token)
                  } else {
                    toast.error('No session token found')
                  }
                }}
              >
                Copy Session Token
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const userData = localStorage.getItem('betflow_session_user')
                  if (userData) {
                    copyToClipboard(userData)
                  } else {
                    toast.error('No user data found')
                  }
                }}
              >
                Copy User Data
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav liveCount={0} />
    </div>
  )
}
