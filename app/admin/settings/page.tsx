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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { useMediaQuery } from "@/hooks/use-media-query"

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
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkEnvText, setBulkEnvText] = useState("")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

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

  const parseBulkEnvVars = (envText: string) => {
    const envVarMap: Record<string, string> = {
      MPESA_CONSUMER_KEY: "consumerKey",
      MPESA_CONSUMER_SECRET: "consumerSecret",
      MPESA_BUSINESS_CODE: "businessCode",
      MPESA_PASSKEY: "passkey",
      MPESA_CALLBACK_URL: "callbackUrl",
      MPESA_TIMEOUT_URL: "timeoutUrl",
      MPESA_SHORTCODE: "shortcode",
      MPESA_INITIATOR_NAME: "initiatorName",
      MPESA_INITIATOR_PASSWORD: "initiatorPassword",
    }

    const lines = envText.split("\n")
    const updates: Record<string, string> = {}

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return

      const match = trimmed.match(/^([A-Z_]+)\s*=\s*(.+)$/)
      if (match) {
        const [, envKey, envValue] = match
        const formField = envVarMap[envKey]
        if (formField) {
          updates[formField] = envValue.trim()
        }
      }
    })

    setFormData((prev) => ({ ...prev, ...updates }))
    setShowBulkImport(false)
    setMessage({ type: "success", text: `${Object.keys(updates).length} field(s) imported successfully` })
    setTimeout(() => setMessage(null), 3000)
  }

  const ConfigForm = () => (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded text-xs font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Bulk Import Section */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-3"
        >
          <span>+</span> Import from .env
        </button>

        {showBulkImport && (
          <div className="space-y-2 p-3 bg-muted/40 rounded border border-border">
            <p className="text-xs text-muted-foreground">
              Paste your environment variables and they'll be automatically mapped to the form fields.
            </p>
            <textarea
              placeholder={`MPESA_CONSUMER_KEY=y4oYKF2t8ql7suePhYPVcvkL6BL1LArfSO1gHY55O0gC2SRC\nMPESA_CONSUMER_SECRET=zHYCg0GrtN3jAUEGbGLfzjyWwu9ymwCp4WHbzA4e8706ewyylCy17N7BFFlw6E1h\nMPESA_BUSINESS_CODE=174379\nMPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`}
              onChange={(e) => setBulkEnvText(e.target.value)}
              value={bulkEnvText}
              className="w-full h-24 p-2 text-xs font-mono bg-background border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => parseBulkEnvVars(bulkEnvText)}
                className="flex-1 text-xs h-8"
              >
                Import
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowBulkImport(false)
                  setBulkEnvText("")
                }}
                className="flex-1 text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="consumerKey" className="text-xs font-semibold">Consumer Key</Label>
        <Input id="consumerKey" value={formData.consumerKey || ""} onChange={(e) => handleInputChange("consumerKey", e.target.value)} className="h-9 font-mono text-xs" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Consumer Secret</Label>
        <div className="relative">
          <Input
            type={showSecrets.consumerSecret ? "text" : "password"}
            value={formData.consumerSecret || ""}
            onChange={(e) => handleInputChange("consumerSecret", e.target.value)}
            className="h-9 font-mono text-xs pr-10"
          />
          <button
            type="button"
            onClick={() => toggleShowSecret("consumerSecret")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSecrets.consumerSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Business Code</Label>
          <Input value={formData.businessCode || ""} onChange={(e) => handleInputChange("businessCode", e.target.value)} className="h-9 font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Shortcode</Label>
          <Input value={formData.shortcode || ""} onChange={(e) => handleInputChange("shortcode", e.target.value)} className="h-9 font-mono text-xs" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Passkey</Label>
        <div className="relative">
          <Input
            type={showSecrets.passkey ? "text" : "password"}
            value={formData.passkey || ""}
            onChange={(e) => handleInputChange("passkey", e.target.value)}
            className="h-9 font-mono text-xs pr-10"
          />
          <button
            type="button"
            onClick={() => toggleShowSecret("passkey")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSecrets.passkey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Initiator Name</Label>
          <Input value={formData.initiatorName || ""} onChange={(e) => handleInputChange("initiatorName", e.target.value)} className="h-9 font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Initiator Password</Label>
          <div className="relative">
            <Input
              type={showSecrets.initiatorPassword ? "text" : "password"}
              value={formData.initiatorPassword || ""}
              onChange={(e) => handleInputChange("initiatorPassword", e.target.value)}
              className="h-9 font-mono text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => toggleShowSecret("initiatorPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSecrets.initiatorPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Callback URL</Label>
        <Input value={formData.callbackUrl || ""} onChange={(e) => handleInputChange("callbackUrl", e.target.value)} className="h-9 font-mono text-xs" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Timeout URL</Label>
        <Input value={formData.timeoutUrl || ""} onChange={(e) => handleInputChange("timeoutUrl", e.target.value)} className="h-9 font-mono text-xs" />
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

      {/* Desktop Sheet or Mobile Drawer */}
      {isDesktop ? (
        <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
          <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col border-l border-border bg-card">
            <SheetHeader className="border-b border-border bg-muted/20 px-4 py-4 flex justify-between items-center">
              <SheetTitle className="text-xl font-bold"> Daraja API</SheetTitle>
              <SheetClose />
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <ConfigForm />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
          <DrawerContent className="flex flex-col max-h-[85vh]">
            <DrawerHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <div className="flex justify-between items-center">
                <DrawerTitle className="text-xl font-bold">Configure Daraja API</DrawerTitle>
                <DrawerClose />
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ConfigForm />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </AdminLayout>
  )
}