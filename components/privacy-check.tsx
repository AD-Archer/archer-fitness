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

    // Don't redirect if already on privacy or terms page
    if (pathname === "/privacy" || pathname === "/terms") {
      return
    }

    // Check privacy and terms acceptance
    const checkAcceptance = async () => {
      try {
        // Check privacy acceptance
        const privacyResponse = await fetch("/api/user/privacy")
        if (privacyResponse.ok) {
          const privacyData = await privacyResponse.json()
          if (!privacyData.privacyAccepted) {
            router.push("/privacy")
            return
          }
        }

        // Check terms acceptance
        const termsResponse = await fetch("/api/user/terms")
        if (termsResponse.ok) {
          const termsData = await termsResponse.json()
          if (!termsData.termsAccepted) {
            router.push("/terms")
            return
          }
        }
      } catch (error) {
        logger.error("Failed to check privacy/terms acceptance:", error)
      }
    }

    checkAcceptance()
  }, [session, status, pathname, router])

  // Don't render anything, just handle the redirect logic
  return null
}