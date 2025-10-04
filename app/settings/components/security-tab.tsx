"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, ShieldOff, Mail, Plus, ShieldCheck, Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"

interface SecurityState {
  hasPassword: boolean
  email: string | null
  linkedAccounts: {
    id: string
    provider: string
  }[]
  twoFactorEnabled: boolean
}

const providerLabels: Record<string, string> = {
  google: "Google",
}

const availableProviders = [
  { id: "google", name: "Google", icon: "🔵" },
]

export function SecurityTab() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [security, setSecurity] = useState<SecurityState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null)
  const [isRequestingReset, setIsRequestingReset] = useState(false)
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string
    qrCode: string
    backupCodes: string[]
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [isVerifying2FA, setIsVerifying2FA] = useState(false)
  const [isDisabling2FA, setIsDisabling2FA] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const hasAlternativeLogin = useMemo(() => {
    if (!security) return false
    return security.hasPassword || security.linkedAccounts.length > 1
  }, [security])

  const loadSecurity = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/user/security")
      if (!response.ok) {
        throw new Error("Failed to load security settings")
      }
      const data = await response.json()
      setSecurity(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load security settings")
      setSecurity(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSecurity()
  }, [])

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!security) return

    setIsUpdatingPassword(true)
    setError(null)

    try {
      const response = await fetch("/api/user/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update password" }))
        throw new Error(data.error || "Unable to update password")
      }

      toast.success(security.hasPassword ? "Password updated" : "Password created")
      await loadSecurity()
      resetPasswordForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleUnlinkProvider = async (provider: string) => {
    if (!security) return
    setUnlinkingProvider(provider)

    try {
      const response = await fetch("/api/user/security", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to unlink provider" }))
        throw new Error(data.error || "Unable to unlink provider")
      }

      toast.success(`Unlinked ${providerLabels[provider] ?? provider}`)
      await loadSecurity()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to unlink provider")
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const handleRequestResetEmail = async () => {
    if (!security?.email) {
      toast.error("We couldn't find your email address")
      return
    }

    setIsRequestingReset(true)

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: security.email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to send reset email" }))
        throw new Error(data.error || "Unable to send reset email")
      }

      toast.success("Check your inbox for reset instructions")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send reset email")
    } finally {
      setIsRequestingReset(false)
    }
  }

  const handleLinkProvider = async (provider: string) => {
    setLinkingProvider(provider)
    try {
      await signIn(provider, { callbackUrl: "/settings?tab=security" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to link provider")
      setLinkingProvider(null)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsUpdatingEmail(true)

    try {
      const response = await fetch("/api/user/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to update email")
      }

      if (data.requiresVerification) {
        toast.success("Verification email sent! Check your inbox.")
        setIsEmailDialogOpen(false)
        setNewEmail("")
        // Redirect to verification page
        router.push("/auth/verify-email")
      } else {
        toast.success("Email address updated")
        setIsEmailDialogOpen(false)
        setNewEmail("")
        await loadSecurity()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update email")
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true)

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to setup 2FA")
      }

      const data = await response.json()
      setTwoFactorSetup(data)
      setIs2FADialogOpen(true)
      toast.success("Scan the QR code with your authenticator app")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to setup 2FA")
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code")
      return
    }

    setIsVerifying2FA(true)

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Invalid code")
      }

      toast.success("Two-factor authentication enabled!")
      setIs2FADialogOpen(false)
      setVerificationCode("")
      setTwoFactorSetup(null)
      await loadSecurity()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code")
    } finally {
      setIsVerifying2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return
    }

    setIsDisabling2FA(true)

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to disable 2FA")
      }

      toast.success("Two-factor authentication disabled")
      await loadSecurity()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable 2FA")
    } finally {
      setIsDisabling2FA(false)
    }
  }

  const handleCopyBackupCodes = () => {
    if (twoFactorSetup?.backupCodes) {
      navigator.clipboard.writeText(twoFactorSetup.backupCodes.join("\n"))
      setCopiedCodes(true)
      toast.success("Backup codes copied to clipboard")
      setTimeout(() => setCopiedCodes(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!security) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </CardTitle>
          <CardDescription>
            Your primary email for account notifications and sign-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{security.email || "No email set"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {security.linkedAccounts.length === 0
                  ? "You can change this anytime"
                  : "Unlink OAuth providers to change your email"}
              </p>
            </div>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={security.linkedAccounts.length > 0}
                >
                  Change Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Email Address</DialogTitle>
                  <DialogDescription>
                    Enter your new email address. You&apos;ll use this to sign in.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email Address</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={isUpdatingEmail}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEmailDialogOpen(false)
                        setNewEmail("")
                      }}
                      disabled={isUpdatingEmail}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail}>
                      {isUpdatingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating
                        </>
                      ) : (
                        "Update Email"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {security.twoFactorEnabled ? (
            <>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is <strong>enabled</strong>. Your account is protected.
                </AlertDescription>
              </Alert>
              <Button 
                variant="destructive" 
                onClick={handleDisable2FA}
                disabled={isDisabling2FA}
              >
                {isDisabling2FA ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <ShieldOff className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is <strong>not enabled</strong>. Enable it for better security.
                </AlertDescription>
              </Alert>
              <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleSetup2FA} disabled={isSettingUp2FA}>
                    {isSettingUp2FA ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                    <DialogDescription className="text-sm">
                      Scan the QR code with your authenticator app
                    </DialogDescription>
                  </DialogHeader>
                  {twoFactorSetup && (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                      <div className="flex justify-center py-2">
                        <Image 
                          src={twoFactorSetup.qrCode} 
                          alt="2FA QR Code" 
                          width={160} 
                          height={160}
                          className="border rounded-lg p-1"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Manual entry code:
                        </Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded break-all">
                            {twoFactorSetup.secret}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(twoFactorSetup.secret)
                              toast.success("Secret copied!")
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Backup Codes</Label>
                        <p className="text-xs text-muted-foreground">
                          Save these in a safe place for account recovery.
                        </p>
                        <div className="bg-muted p-2 rounded space-y-0.5 max-h-24 overflow-y-auto text-xs font-mono">
                          {twoFactorSetup.backupCodes.map((code, idx) => (
                            <div key={idx} className="text-xs">
                              {code}
                            </div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyBackupCodes}
                          className="w-full h-8 text-xs"
                        >
                          {copiedCodes ? (
                            <>
                              <Check className="mr-2 h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-3 w-3" />
                              Copy All Codes
                            </>
                          )}
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label htmlFor="verificationCode" className="text-sm">Verification Code</Label>
                        <Input
                          id="verificationCode"
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          className="text-center text-lg tracking-widest h-10"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIs2FADialogOpen(false)
                            setTwoFactorSetup(null)
                            setVerificationCode("")
                          }}
                          className="flex-1 h-9"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleVerify2FA}
                          disabled={isVerifying2FA || verificationCode.length !== 6}
                          className="flex-1 h-9"
                        >
                          {isVerifying2FA ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify & Enable"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </CardTitle>
          <CardDescription>
            {security.hasPassword
              ? "Update your password to keep your account secure"
              : "Create a password so you can sign in without Google"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {security.hasPassword ? (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                  disabled={isUpdatingPassword}
                />
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  You don&apos;t have a password yet. Set one now to sign in with email and unlink OAuth providers if you prefer.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
                disabled={isUpdatingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                disabled={isUpdatingPassword}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : security.hasPassword ? (
                  "Update password"
                ) : (
                  "Create password"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleRequestResetEmail}
                disabled={isRequestingReset}
              >
                {isRequestingReset ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset email
                  </>
                ) : (
                  "Email me a reset link"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected providers</CardTitle>
          <CardDescription>Manage the sign-in providers linked to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {security.linkedAccounts.length === 0 ? (
            <Alert>
              <ShieldOff className="h-4 w-4" />
              <AlertDescription>
                No OAuth providers are linked right now. You&apos;ll sign in with your email and password.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {security.linkedAccounts.map((account) => {
                const providerLabel = providerLabels[account.provider] ?? account.provider
                const canUnlink = hasAlternativeLogin || security.linkedAccounts.length > 1

                return (
                  <div
                    key={account.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="uppercase">
                        {account.provider}
                      </Badge>
                      <span className="font-medium">{providerLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {!canUnlink && (
                        <span className="text-xs text-muted-foreground">
                          Add a password before unlinking
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleUnlinkProvider(account.provider)}
                        disabled={unlinkingProvider === account.provider || !canUnlink}
                      >
                        {unlinkingProvider === account.provider ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing
                          </>
                        ) : (
                          "Unlink"
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Link additional providers</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableProviders
                .filter((provider) => !security.linkedAccounts.some((acc) => acc.provider === provider.id))
                .map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    onClick={() => handleLinkProvider(provider.id)}
                    disabled={linkingProvider === provider.id}
                    className="justify-start"
                  >
                    {linkingProvider === provider.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Linking {provider.name}...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Link {provider.name}
                      </>
                    )}
                  </Button>
                ))}
            </div>
            {security.linkedAccounts.length === availableProviders.length && (
              <p className="text-sm text-muted-foreground">
                All available providers are already linked to your account.
              </p>
            )}
          </div>

          <Separator />
          <p className="text-sm text-muted-foreground">
            Linking multiple providers gives you flexibility in how you sign in to your account.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
