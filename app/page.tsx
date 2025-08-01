import VoiceAssistant from "./components/voice-assistant"
import PWAInstaller from "./components/pwa-installer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <VoiceAssistant />
        <PWAInstaller />
      </div>
    </main>
  )
}
