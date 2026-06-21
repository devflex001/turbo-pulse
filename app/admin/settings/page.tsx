"use client"

import React, { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Eye, EyeOff, Loader, Check, Wallet, Percent } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface DarajaConfig {
  _id: string
  consumerKey: string
  consumerSecret: string
  businessCode: string
  passkey: string
  callbackUrl: string
  timeoutUrl: string
  shortcode: string
  initiatorName: string
  initiatorPassword: string
  isProduction: boolean
  isEnabled: boolean
  useEnvVariables: boolean
  source?: string
  updatedAt: number
}

export default function SettingsPage() {
  const [showDrawer, setShowDrawer] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(true)

  const currentConfig = useQuery(api.daraja.getConfig)
  const saveConfig = useMutation(api.daraja.saveConfig)
  const testConfig = useMutation(api.daraja.testConfig)

  // State for new settings cards
  const [limitsForm, setLimitsForm] = useState({ minDeposit: "100", minWithdrawal: "500" })
  const [feesForm, setFeesForm] = useState({ withdrawalFeePercent: "2.5", flatFee: "0" })

  const [formData, setFormData] = useState<Partial<DarajaConfig>>({
    consumerKey: "",
    consumerSecret: "",
    businessCode: "",
    passkey: "",
    callbackUrl: "",
    timeoutUrl: "",
    shortcode: "",
    initiatorName: "",
    initiatorPassword: "",
    isProduction: false,
  })

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024)
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (currentConfig && currentConfig.source !== "environment") {
      setFormData(currentConfig)
    }
  }, [currentConfig])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveConfig = async () => {
    try {
      setLoading(true)
      setMessage(null)
      await saveConfig({
        consumerKey: formData.consumerKey || "",
        consumerSecret: formData.consumerSecret || "",
        businessCode: formData.businessCode || "",
        passkey: formData.passkey || "",
        callbackUrl: formData.callbackUrl || "",
        timeoutUrl: formData.timeoutUrl || "",
        shortcode: formData.shortcode || "",
        initiatorName: formData.initiatorName || "",
        initiatorPassword: formData.initiatorPassword || "",
        isProduction: formData.isProduction || false,
      })
      setMessage({ type: "success", text: "Configuration saved" })
      setTimeout(() => setShowDrawer(false), 1000)
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConfig = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const result = await testConfig({
        consumerKey: formData.consumerKey || "",
        consumerSecret: formData.consumerSecret || "",
      })
      setMessage({ type: result.success ? "success" : "error", text: result.message })
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const ConfigForm = () => (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded text-xs font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs">Environment</Label>
        <Select value={formData.isProduction ? "production" : "sandbox"} onValueChange={(value) => handleInputChange("isProduction", value === "production")}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">🟡 Sandbox</SelectItem>
            <SelectItem value="production">🔴 Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consumerKey" className="text-xs">Consumer Key</Label>
        <Input id="consumerKey" value={formData.consumerKey || ""} onChange={(e) => handleInputChange("consumerKey", e.target.value)} className="h-8 font-mono text-xs" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Consumer Secret</Label>
        <div className="flex gap-2">
          <Input type={showSecrets.consumerSecret ? "text" : "password"} value={formData.consumerSecret || ""} onChange={(e) => handleInputChange("consumerSecret", e.target.value)} className="h-8 font-mono text-xs flex-1" />
          <Button variant="ghost" size="sm" onClick={() => toggleShowSecret("consumerSecret")} className="h-8 w-8 p-0">
            {showSecrets.consumerSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Business Code</Label>
          <Input value={formData.businessCode || ""} onChange={(e) => handleInputChange("businessCode", e.target.value)} className="h-8 font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Shortcode</Label>
          <Input value={formData.shortcode || ""} onChange={(e) => handleInputChange("shortcode", e.target.value)} className="h-8 font-mono text-xs" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Passkey</Label>
        <div className="flex gap-2">
          <Input type={showSecrets.passkey ? "text" : "password"} value={formData.passkey || ""} onChange={(e) => handleInputChange("passkey", e.target.value)} className="h-8 font-mono text-xs flex-1" />
          <Button variant="ghost" size="sm" onClick={() => toggleShowSecret("passkey")} className="h-8 w-8 p-0">
            {showSecrets.passkey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Initiator Name</Label>
          <Input value={formData.initiatorName || ""} onChange={(e) => handleInputChange("initiatorName", e.target.value)} className="h-8 font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Initiator Password</Label>
          <div className="flex gap-2">
            <Input type={showSecrets.initiatorPassword ? "text" : "password"} value={formData.initiatorPassword || ""} onChange={(e) => handleInputChange("initiatorPassword", e.target.value)} className="h-8 font-mono text-xs flex-1" />
            <Button variant="ghost" size="sm" onClick={() => toggleShowSecret("initiatorPassword")} className="h-8 w-8 p-0">
              {showSecrets.initiatorPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Callback URL</Label>
        <Input value={formData.callbackUrl || ""} onChange={(e) => handleInputChange("callbackUrl", e.target.value)} className="h-8 font-mono text-xs text-xs" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Timeout URL</Label>
        <Input value={formData.timeoutUrl || ""} onChange={(e) => handleInputChange("timeoutUrl", e.target.value)} className="h-8 font-mono text-xs" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleTestConfig} variant="outline" size="sm" disabled={loading} className="flex-1">
          {loading ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
          <span className="ml-1">Test</span>
        </Button>
        <Button onClick={handleSaveConfig} size="sm" disabled={loading} className="flex-1">
          {loading ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
          <span className="ml-1">Save</span>
        </Button>
      </div>
    </div>
  )

  return (
    <AdminLayout pageTitle="Settings">
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto bg-background">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage platform integrations and financial limits</p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Daraja Config */}
          <Card className="flex flex-col border border-border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-primary" />
                <CardTitle className="text-sm">Daraja API</CardTitle>
              </div>
              <CardDescription className="text-xs">M-Pesa payment gateway credentials.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-xs text-muted-foreground space-y-2">
              {currentConfig ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${currentConfig.isProduction ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {currentConfig.isProduction ? "Production" : "Sandbox"}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded font-medium ${currentConfig.source === "environment" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {currentConfig.source === "environment" ? "ENV" : "DB"}
                    </span>
                  </div>
                  <p>Code: {currentConfig.businessCode}</p>
                </>
              ) : (
                <p>Not configured yet.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setShowDrawer(true)} variant="outline" size="sm" className="w-full">
                Configure Gateway
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Transaction Limits */}
          <Card className="flex flex-col border border-border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <CardTitle className="text-sm">Transaction Limits</CardTitle>
              </div>
              <CardDescription className="text-xs">Set deposit and withdrawal boundaries.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum Deposit (KES)</Label>
                <Input 
                  type="number" 
                  value={limitsForm.minDeposit} 
                  onChange={(e) => setLimitsForm(prev => ({ ...prev, minDeposit: e.target.value }))}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum Withdrawal (KES)</Label>
                <Input 
                  type="number" 
                  value={limitsForm.minWithdrawal} 
                  onChange={(e) => setLimitsForm(prev => ({ ...prev, minWithdrawal: e.target.value }))}
                  className="h-8 text-xs" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">Save Limits</Button>
            </CardFooter>
          </Card>

          {/* Card 3: Fees & Charges */}
          <Card className="flex flex-col border border-border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Percent className="size-4 text-primary" />
                <CardTitle className="text-sm">Fees & Charges</CardTitle>
              </div>
              <CardDescription className="text-xs">Configure platform transaction cuts.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Withdrawal Fee (%)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={feesForm.withdrawalFeePercent} 
                  onChange={(e) => setFeesForm(prev => ({ ...prev, withdrawalFeePercent: e.target.value }))}
                  className="h-8 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Flat Additional Fee (KES)</Label>
                <Input 
                  type="number" 
                  value={feesForm.flatFee} 
                  onChange={(e) => setFeesForm(prev => ({ ...prev, flatFee: e.target.value }))}
                  className="h-8 text-xs" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">Save Fees</Button>
            </CardFooter>
          </Card>

        </div>
      </div>

      {/* Desktop Modal or Mobile Drawer */}
      {isDesktop ? (
        <Dialog open={showDrawer} onOpenChange={setShowDrawer}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Daraja API</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <ConfigForm />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
          <DrawerContent>
            <DrawerHeader className="flex justify-between items-center">
              <DrawerTitle>Configure Daraja API</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
              <ConfigForm />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </AdminLayout>
  )
}