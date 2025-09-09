"use client"

import { useSession } from "next-auth/react"
import { LoadingDashboard } from "@/components/dashboard/loading-dashboard"
import { WelcomeScreen } from "@/components/dashboard/welcome-screen"
import { AuthenticatedDashboard } from "@/components/dashboard/authenticated-dashboard"

export default function Dashboard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingDashboard />
  }

  if (!session) {
    return <WelcomeScreen />
  }

  return <AuthenticatedDashboard />
}
