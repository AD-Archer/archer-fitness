"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import { usePWA } from '@/hooks/use-pwa'

export function PWAInstallPrompt() {
  const { isPWA, isInstallable, installPWA } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissedPrompt = localStorage.getItem('pwa-install-dismissed')
    if (dismissedPrompt) {
      const dismissedTime = parseInt(dismissedPrompt)
      const oneDay = 48 * 60 * 60 * 1000 // 48 hours in milliseconds

      // Show again after 24 hours
      if (Date.now() - dismissedTime > oneDay) {
        localStorage.removeItem('pwa-install-dismissed')
        setDismissed(false)
      } else {
        setDismissed(true)
      }
    }
  }, [])

  useEffect(() => {
    // Show prompt if not in PWA mode and installable
    if (!isPWA && isInstallable && !dismissed) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isPWA, isInstallable, dismissed])

  const handleInstall = async () => {
    await installPWA()
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install Archer Fitness
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Get the full experience! Install our app for push notifications, and a native app feel.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}