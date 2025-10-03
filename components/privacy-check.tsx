"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function PrivacyCheck() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Only check for authenticated users
    if (status === "loading" || !session?.user) {
      setChecked(true)
      return
    }

    // Don't redirect if already on privacy page
    if (pathname === "/privacy") {
      setChecked(true)
      return
    }

    // Check privacy acceptance
    const checkPrivacy = async () => {
      try {
        const response = await fetch("/api/user/privacy")
        if (response.ok) {
          const data = await response.json()
          if (!data.privacyAccepted) {
            router.push("/privacy")
            return
          }
        }
      } catch (error) {
        console.error("Failed to check privacy acceptance:", error)
      }
      setChecked(true)
    }

    checkPrivacy()
  }, [session, status, pathname, router])

  // Don't render anything, just handle the redirect logic
  return null
}