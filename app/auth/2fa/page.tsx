"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function TwoFactorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Email not found. Please sign in again.")
      router.push("/auth/signin")
      return
    }

    if (!code || code.length < 6) {
      toast.error("Please enter a valid code")
      return
    }

    setIsLoading(true)

    try {
      // First verify the 2FA code
      const verifyResponse = await fetch("/api/auth/2fa/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          code: code.replace(/\s/g, ""),
          isBackupCode: useBackupCode 
        }),
      })

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.error || "Invalid code")
      }

      // If 2FA verification successful, complete the signin
      const result = await signIn("credentials", {
        email,
        password: searchParams.get("password") || "",
        redirect: false,
      })

      if (result?.error) {
        toast.error("Authentication failed")
        router.push("/auth/signin")
        return
      }

      toast.success("Successfully signed in!")
      router.push(searchParams.get("callbackUrl") || "/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid code")
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>
              Email not found. Please sign in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Return to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Enter the {useBackupCode ? "backup code" : "6-digit code"} from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                {useBackupCode ? "Backup Code" : "Authentication Code"}
              </Label>
              <Input
                id="code"
                type="text"
                placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={useBackupCode ? 9 : 6}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
                autoComplete="off"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setCode("")
                }}
                disabled={isLoading}
              >
                {useBackupCode ? "Use authenticator code" : "Use backup code"}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/auth/signin" className="hover:text-primary underline">
                Return to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
