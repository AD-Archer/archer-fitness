"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { logger } from "@/lib/logger"

export function PrivacyCheck() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only check for authenticated users
    if (status === "loading" || !session?.user) {
      return
    }

    // Don't redirect if already on privacy page
    if (pathname === "/privacy") {
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
        logger.error("Failed to check privacy acceptance:", error)
      }
    }

    checkPrivacy()
  }, [session, status, pathname, router])

  // Don't render anything, just handle the redirect logic
  return null
}