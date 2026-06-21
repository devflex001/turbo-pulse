"use client"

import React, { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Copy, Eye, EyeOff, Loader, Plus, Trash2, Check as CheckIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  updatedBy: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)

  const currentConfig = useQuery(api.daraja.getConfig)
  const allConfigs = useQuery(api.daraja.getAllConfigs)

  const saveConfig = useMutation(api.daraja.saveConfig)
  const testConfig = useMutation(api.daraja.testConfig)
  const switchToEnv = useMutation(api.daraja.switchToEnvVariables)
  const activateConfig = useMutation(api.daraja.activateConfig)
  const deleteConfig = useMutation(api.daraja.deleteConfig)

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
      setMessage({ type: "success", text: "Configuration saved successfully" })
    } catch (error) {
      setMessage({ type: "error", text: `Error saving configuration: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConfig = async () => {
    try {
      setTestingConfig("current")
      setMessage(null)
      const result = await testConfig({
        consumerKey: formData.consumerKey || "",
        consumerSecret: formData.consumerSecret || "",
      })
      setMessage({ type: result.success ? "success" : "error", text: result.message })
    } catch (error) {
      setMessage({ type: "error", text: `Error testing configuration: ${String(error)}` })
    } finally {
      setTestingConfig(null)
    }
  }

  const handleSwitchToEnv = async () => {
    try {
      setLoading(true)
      setMessage(null)
      await switchToEnv()
      setMessage({ type: "success", text: "Switched to environment variables" })
    } catch (error) {
      setMessage({ type: "error", text: `Error switching: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const handleActivateConfig = async (configId: string | any) => {
    try {
      setLoading(true)
      setMessage(null)
      await activateConfig({ configId: configId as any })
      setMessage({ type: "success", text: "Configuration activated" })
    } catch (error) {
      setMessage({ type: "error", text: `Error activating configuration: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfig = async (configId: string | any) => {
    try {
      setLoading(true)
      setMessage(null)
      await deleteConfig({ configId: configId as any })
      setMessage({ type: "success", text: "Configuration deleted" })
    } catch (error) {
      setMessage({ type: "error", text: `Error deleting configuration: ${String(error)}` })
    } finally {
      setLoading(false)
    }
  }

  const toggleShowSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard" })
    setTimeout(() => setMessage(null), 2000)
  }

  const sensitiveFields = [
    "consumerSecret",
    "passkey",
    "initiatorPassword",
  ]

  return (
    <AdminLayout pageTitle="Settings">
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage Daraja API configuration for M-Pesa integration
            </p>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <AlertCircle className={`size-4 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} />
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="saved">Saved Configs</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {currentConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Configuration</CardTitle>
                    <CardDescription>
                      Currently using: {currentConfig.source === "environment" ? "Environment Variables" : "Database Configuration"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 p-4 bg-accent rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Active Source</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentConfig.source === "environment"
                            ? "Using environment variables from .env"
                            : `Using database configuration (Production: ${currentConfig.isProduction ? "Yes" : "No"})`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-medium ${currentConfig.source === "environment" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {currentConfig.source === "environment" ? "ENV" : "DB"}
                      </div>
                    </div>

                    {/* Config Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Business Code</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">
                          {currentConfig.businessCode}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Shortcode</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">
                          {currentConfig.shortcode}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Initiator Name</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded text-foreground">
                          {currentConfig.initiatorName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Environment</Label>
                        <p className={`text-sm font-mono p-2 rounded ${currentConfig.isProduction ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {currentConfig.isProduction ? "🔴 Production" : "🟡 Sandbox"}
                        </p>
                      </div>
                    </div>

                    {/* Callback URLs */}
                    <div className="space-y-3 border-t border-border pt-4">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Callback URLs</Label>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Callback URL</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono bg-muted p-2 rounded flex-1 text-foreground truncate">
                              {currentConfig.callbackUrl}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(currentConfig.callbackUrl)}
                              className="size-8 p-0"
                            >
                              <Copy className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Timeout URL</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono bg-muted p-2 rounded flex-1 text-foreground truncate">
                              {currentConfig.timeoutUrl}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(currentConfig.timeoutUrl)}
                              className="size-8 p-0"
                            >
                              <Copy className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {currentConfig.source === "environment" && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">Want to override with database configuration?</p>
                        <Button onClick={() => setActiveTab("configure")} variant="outline" size="sm">
                          <Plus className="size-4 mr-2" />
                          Add Configuration
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Configure Tab */}
            <TabsContent value="configure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add/Edit Configuration</CardTitle>
                  <CardDescription>
                    Create a new Daraja API configuration to override environment variables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Environment Toggle */}
                  <div className="space-y-3 p-4 bg-accent rounded-lg border border-border">
                    <Label className="text-sm font-medium text-foreground">Environment</Label>
                    <Select value={formData.isProduction ? "production" : "sandbox"} onValueChange={(value) => handleInputChange("isProduction", value === "production")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">🟡 Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">🔴 Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Credentials Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">API Credentials</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consumerKey" className="text-sm font-medium">
                          Consumer Key
                        </Label>
                        <Input
                          id="consumerKey"
                          value={formData.consumerKey || ""}
                          onChange={(e) => handleInputChange("consumerKey", e.target.value)}
                          placeholder="Enter consumer key"
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consumerSecret" className="text-sm font-medium">
                          Consumer Secret
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="consumerSecret"
                            type={showSecrets.consumerSecret ? "text" : "password"}
                            value={formData.consumerSecret || ""}
                            onChange={(e) => handleInputChange("consumerSecret", e.target.value)}
                            placeholder="Enter consumer secret"
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowSecret("consumerSecret")}
                            className="size-9 p-0"
                          >
                            {showSecrets.consumerSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Details Section */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessCode" className="text-sm font-medium">
                          Business Code
                        </Label>
                        <Input
                          id="businessCode"
                          value={formData.businessCode || ""}
                          onChange={(e) => handleInputChange("businessCode", e.target.value)}
                          placeholder="e.g., 174379"
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortcode" className="text-sm font-medium">
                          Shortcode
                        </Label>
                        <Input
                          id="shortcode"
                          value={formData.shortcode || ""}
                          onChange={(e) => handleInputChange("shortcode", e.target.value)}
                          placeholder="e.g., 174379"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Security</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passkey" className="text-sm font-medium">
                          Passkey
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="passkey"
                            type={showSecrets.passkey ? "text" : "password"}
                            value={formData.passkey || ""}
                            onChange={(e) => handleInputChange("passkey", e.target.value)}
                            placeholder="Enter passkey"
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowSecret("passkey")}
                            className="size-9 p-0"
                          >
                            {showSecrets.passkey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="initiatorName" className="text-sm font-medium">
                            Initiator Name
                          </Label>
                          <Input
                            id="initiatorName"
                            value={formData.initiatorName || ""}
                            onChange={(e) => handleInputChange("initiatorName", e.target.value)}
                            placeholder="e.g., testapi"
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initiatorPassword" className="text-sm font-medium">
                            Initiator Password
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="initiatorPassword"
                              type={showSecrets.initiatorPassword ? "text" : "password"}
                              value={formData.initiatorPassword || ""}
                              onChange={(e) => handleInputChange("initiatorPassword", e.target.value)}
                              placeholder="Enter password"
                              className="font-mono text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleShowSecret("initiatorPassword")}
                              className="size-9 p-0"
                            >
                              {showSecrets.initiatorPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Callbacks Section */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Callback URLs</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="callbackUrl" className="text-sm font-medium">
                          Callback URL
                        </Label>
                        <Input
                          id="callbackUrl"
                          value={formData.callbackUrl || ""}
                          onChange={(e) => handleInputChange("callbackUrl", e.target.value)}
                          placeholder="https://yourdomain.com/api/mpesa/callback"
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeoutUrl" className="text-sm font-medium">
                          Timeout URL
                        </Label>
                        <Input
                          id="timeoutUrl"
                          value={formData.timeoutUrl || ""}
                          onChange={(e) => handleInputChange("timeoutUrl", e.target.value)}
                          placeholder="https://yourdomain.com/api/mpesa/timeout"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button onClick={handleTestConfig} variant="outline" disabled={loading || testingConfig !== null}>
                      {testingConfig === "current" ? (
                        <>
                          <Loader className="size-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="size-4 mr-2" />
                          Test Config
                        </>
                      )}
                    </Button>
                    <Button onClick={handleSaveConfig} disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="size-4 mr-2" />
                          Save & Activate
                        </>
                      )}
                    </Button>
                  </div>

                  {currentConfig && currentConfig.source !== "environment" && (
                    <div className="pt-4 border-t border-border">
                      <Button onClick={handleSwitchToEnv} variant="outline" size="sm" className="w-full">
                        Switch Back to Environment Variables
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved Configs Tab */}
            <TabsContent value="saved" className="space-y-4">
              {!allConfigs || allConfigs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 bg-muted rounded-full mb-4">
                      <AlertCircle className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No saved configurations</p>
                    <p className="text-xs text-muted-foreground">Create one in the Configure tab to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allConfigs.map((config) => (
                    <Card key={config._id} className={config.isEnabled ? "border-primary border-2" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-sm font-semibold text-foreground">
                                {config.isProduction ? "🔴 Production" : "🟡 Sandbox"} - {config.businessCode}
                              </h3>
                              {config.isEnabled && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  <Check className="size-3" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Consumer Key: {config.consumerKey.substring(0, 8)}***
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated: {new Date(config.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {!config.isEnabled && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivateConfig(config._id)}
                                disabled={loading}
                              >
                                Activate
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="size-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Configuration</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this configuration? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-3 justify-end pt-4">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteConfig(config._id)}
                                    disabled={loading}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  )
}
