"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowBanner(false)
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
  }

  if (!isInstallable || !showBanner) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Install Voice Assistant</h3>
              <p className="text-sm text-gray-600 mt-1">Install this app for offline access and better performance</p>
            </div>
            <Button
              onClick={dismissBanner}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button onClick={dismissBanner} variant="outline" size="sm">
              Later
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Install Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={handleInstallClick} className="shadow-lg">
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </div>
    </>
  )
}
