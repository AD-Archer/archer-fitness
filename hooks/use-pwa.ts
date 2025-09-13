"use client"

import { useState, useEffect } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [isPWA, setIsPWA] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if app is running in PWA mode
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isPWA = isStandalone || isIOSStandalone

      setIsPWA(isPWA)
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    checkPWA()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Also check periodically in case display mode changes
    const interval = setInterval(checkPWA, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearInterval(interval)
    }
  }, [])

  const installPWA = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        // User accepted the install prompt
        setDeferredPrompt(null)
        setIsInstallable(false)
      } else {
        // User dismissed the install prompt
        setDeferredPrompt(null)
      }
    } catch {
      // Error during PWA installation
      setDeferredPrompt(null)
    }
  }

  return {
    isPWA,
    isInstallable,
    installPWA
  }
}