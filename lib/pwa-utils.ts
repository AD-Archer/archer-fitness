/**
 * Utility functions for PWA detection and management
 */

export function isPWA(): boolean {
  // Check if running in standalone mode (PWA)
  if (typeof window === 'undefined') return false

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true

  return isStandalone || isIOSStandalone
}

export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false

  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window
}

export function getPWADisplayMode(): string {
  if (typeof window === 'undefined') return 'browser'

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }

  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }

  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }

  return 'browser'
}

export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false

  // Check if the app is not already installed
  if (isPWA()) return false

  // Check if the browser supports PWA installation
  return 'BeforeInstallPromptEvent' in window
}