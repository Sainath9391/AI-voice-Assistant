"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceMetrics {
  sttLatency: number
  apiLatency: number
  ttsLatency: number
  totalLatency: number
}

// Declare global types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    speechSynthesis: any
    SpeechSynthesisUtterance: any
  }
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workersReady, setWorkersReady] = useState(false)
  const [initializationStatus, setInitializationStatus] = useState("Initializing...")
  const [speechSupported, setSpeechSupported] = useState(false)
  const [useNativeTTS, setUseNativeTTS] = useState(true)
  const [microphonePermission, setMicrophonePermission] = useState<"granted" | "denied" | "prompt" | "unknown">(
    "unknown",
  )

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const whisperWorkerRef = useRef<Worker | null>(null)
  const ttsWorkerRef = useRef<Worker | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize workers and audio context
  useEffect(() => {
    initializeWorkers()
    initializeSpeechRecognition()
    checkMicrophonePermission()
    return () => {
      cleanupWorkers()
      cleanupSpeechRecognition()
    }
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName })
        setMicrophonePermission(permission.state)

        permission.onchange = () => {
          setMicrophonePermission(permission.state)
        }
      }
    } catch (error) {
      console.log("Permission API not supported")
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Permission granted, close the stream
      stream.getTracks().forEach((track) => track.stop())
      setMicrophonePermission("granted")

      // Now initialize speech recognition
      initializeSpeechRecognition()
    } catch (err: any) {
      console.error("Microphone permission error:", err)
      setMicrophonePermission("denied")

      if (err.name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings and refresh the page.",
        )
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.")
      } else {
        setError(`Microphone error: ${err.message}`)
      }
    }
  }

  const initializeSpeechRecognition = () => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      setSpeechSupported(true)
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log("Speech recognition result:", transcript)
        setTranscript(transcript)
        handleTranscriptComplete(transcript, 200) // Mock STT latency
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)

        let errorMessage = ""
        switch (event.error) {
          case "not-allowed":
            errorMessage = "Microphone access denied. Please allow microphone access and try again."
            setMicrophonePermission("denied")
            break
          case "no-speech":
            errorMessage = "No speech detected. Please try speaking again."
            break
          case "audio-capture":
            errorMessage = "Audio capture failed. Please check your microphone."
            break
          case "network":
            errorMessage = "Network error. Please check your internet connection."
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }

        setError(errorMessage)
        setIsProcessing(false)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended")
        setIsListening(false)
        if (!transcript) {
          setIsProcessing(false)
        }
      }

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started")
        setIsListening(true)
      }
    } else {
      console.log("Speech recognition not supported")
      setSpeechSupported(false)
    }
  }

  const cleanupSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log("Error stopping speech recognition:", e)
      }
    }
  }

  const initializeWorkers = async () => {
    try {
      setInitializationStatus("Loading Whisper model...")

      // Initialize Whisper worker with correct path
      whisperWorkerRef.current = new Worker("/workers/whisper-worker.js")
      whisperWorkerRef.current.postMessage({ type: "init" })

      setInitializationStatus("Loading TTS model...")

      // Initialize TTS worker with correct path
      ttsWorkerRef.current = new Worker("/workers/tts-worker.js")
      ttsWorkerRef.current.postMessage({ type: "init" })

      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Set up worker message handlers
      setupWorkerHandlers()
    } catch (err) {
      setError("Failed to initialize workers")
      console.error("Worker initialization error:", err)
    }
  }

  const setupWorkerHandlers = () => {
    let whisperReady = false
    let ttsReady = false

    const checkAllReady = () => {
      if (whisperReady && ttsReady) {
        setWorkersReady(true)
        setInitializationStatus("Ready!")
      }
    }

    if (whisperWorkerRef.current) {
      whisperWorkerRef.current.onmessage = (event) => {
        const { type, transcript, latency, error: workerError } = event.data

        if (type === "initialized") {
          whisperReady = true
          checkAllReady()
        } else if (type === "transcript") {
          setTranscript(transcript)
          handleTranscriptComplete(transcript, latency)
        } else if (type === "error") {
          setError(workerError)
          setIsProcessing(false)
        }
      }
    }

    if (ttsWorkerRef.current) {
      ttsWorkerRef.current.onmessage = (event) => {
        const { type, audioBuffer, latency, error: workerError } = event.data

        if (type === "initialized") {
          ttsReady = true
          checkAllReady()
        } else if (type === "audio") {
          if (useNativeTTS) {
            // Use browser's native TTS instead of worker audio
            speakWithNativeTTS(response, latency)
          } else {
            playAudio(audioBuffer, latency)
          }
        } else if (type === "error") {
          setError(workerError)
          setIsProcessing(false)
        }
      }
    }
  }

  const cleanupWorkers = () => {
    if (whisperWorkerRef.current) {
      whisperWorkerRef.current.postMessage({ type: "cleanup" })
      whisperWorkerRef.current.terminate()
    }
    if (ttsWorkerRef.current) {
      ttsWorkerRef.current.postMessage({ type: "cleanup" })
      ttsWorkerRef.current.terminate()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const startListening = async () => {
    try {
      setError(null)
      setTranscript("")
      setResponse("")
      setMetrics(null)
      audioChunksRef.current = []

      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      }

      // Check microphone permission first
      if (microphonePermission === "denied") {
        setError("Microphone access is denied. Please enable microphone access in your browser settings.")
        return
      }

      if (microphonePermission !== "granted") {
        await requestMicrophonePermission()
        return
      }

      // Use Web Speech API for real speech recognition if supported
      if (speechSupported && recognitionRef.current) {
        console.log("Starting speech recognition...")
        recognitionRef.current.start()
      } else {
        // Fallback to MediaRecorder if Speech Recognition not available
        setIsListening(true)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })

        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
        })

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorderRef.current.onstop = () => {
          processAudio()
        }

        mediaRecorderRef.current.start(100)
      }
    } catch (err: any) {
      console.error("Microphone access error:", err)

      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access and try again.")
        setMicrophonePermission("denied")
      } else {
        setError(`Failed to access microphone: ${err.message}`)
      }

      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (speechSupported && recognitionRef.current && isListening) {
      console.log("Stopping speech recognition...")
      try {
        recognitionRef.current.stop()
        setIsProcessing(true)
      } catch (e) {
        console.log("Error stopping recognition:", e)
        setIsListening(false)
        setIsProcessing(false)
      }
    } else if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsListening(false)
      setIsProcessing(true)
    }
  }

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setIsProcessing(false)
      return
    }

    try {
      // Create audio blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

      // Send to Whisper worker for processing
      if (whisperWorkerRef.current) {
        whisperWorkerRef.current.postMessage({
          type: "transcribe",
          data: { audioBlob, isFinal: true },
        })
      }
    } catch (err) {
      setError("Failed to process audio")
      setIsProcessing(false)
      console.error("Audio processing error:", err)
    }
  }

  const handleTranscriptComplete = async (transcript: string, sttLatency: number) => {
    if (!transcript.trim()) {
      setIsProcessing(false)
      return
    }

    try {
      const apiStartTime = performance.now()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      let aiResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.substring(2)
                const data = JSON.parse(jsonStr)
                if (data.textDelta) {
                  aiResponse += data.textDelta
                }
              } catch (e) {
                // Ignore parsing errors for malformed JSON
              }
            }
          }
        }
      }

      const apiEndTime = performance.now()
      const apiLatency = apiEndTime - apiStartTime

      setResponse(aiResponse)

      // Use native browser TTS for better audio quality
      if (useNativeTTS && aiResponse.trim()) {
        speakWithNativeTTS(aiResponse, 0)
      } else if (ttsWorkerRef.current && aiResponse.trim()) {
        ttsWorkerRef.current.postMessage({
          type: "synthesize",
          data: { text: aiResponse },
        })
      }

      setMetrics({
        sttLatency,
        apiLatency,
        ttsLatency: 0,
        totalLatency: 0,
      })
    } catch (err) {
      setError("Failed to get AI response. Please check your OpenAI API key.")
      setIsProcessing(false)
      console.error("AI response error:", err)
    }
  }

  const speakWithNativeTTS = (text: string, workerLatency: number) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      console.log("Native TTS not supported, falling back to worker")
      return
    }

    const startTime = performance.now()
    setIsSpeaking(true)

    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.lang = "en-US"

    utterance.onstart = () => {
      console.log("TTS started")
      const ttsLatency = performance.now() - startTime
      setMetrics((prev) => {
        if (!prev) return null
        const totalLatency = (prev.sttLatency || 0) + (prev.apiLatency || 0) + ttsLatency
        return {
          ...prev,
          ttsLatency,
          totalLatency,
        }
      })
    }

    utterance.onend = () => {
      console.log("TTS ended")
      setIsSpeaking(false)
      setIsProcessing(false)
    }

    utterance.onerror = (event) => {
      console.error("TTS error:", event.error)
      setError(`Speech synthesis error: ${event.error}`)
      setIsSpeaking(false)
      setIsProcessing(false)
    }

    // Cancel any ongoing speech and start new one
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const playAudio = async (audioBuffer: ArrayBuffer, ttsLatency: number) => {
    try {
      if (!audioContextRef.current) return

      const audioData = new Float32Array(audioBuffer)
      const buffer = audioContextRef.current.createBuffer(1, audioData.length, 22050)
      buffer.copyToChannel(audioData, 0)

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.connect(audioContextRef.current.destination)

      source.start()

      setMetrics((prev) => {
        if (!prev)
          return {
            sttLatency: 0,
            apiLatency: 0,
            ttsLatency,
            totalLatency: ttsLatency,
          }
        const totalLatency = (prev.sttLatency || 0) + (prev.apiLatency || 0) + ttsLatency
        return {
          ...prev,
          ttsLatency,
          totalLatency,
        }
      })

      source.onended = () => {
        setIsProcessing(false)
      }
    } catch (err) {
      setError("Failed to play audio")
      setIsProcessing(false)
      console.error("Audio playback error:", err)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const toggleTTSMode = () => {
    setUseNativeTTS(!useNativeTTS)
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsProcessing(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Voice Assistant PWA
            {isSpeaking && <span className="text-sm text-green-600 animate-pulse">🔊 Speaking...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Microphone Permission Status */}
          {microphonePermission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium">Microphone Access Denied</p>
                  <p className="text-red-600 text-xs mt-1">
                    Please enable microphone access in your browser settings and refresh the page.
                  </p>
                </div>
                <Button onClick={requestMicrophonePermission} size="sm" variant="outline">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {microphonePermission === "prompt" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-yellow-700 text-sm font-medium">Microphone Permission Required</p>
                  <p className="text-yellow-600 text-xs mt-1">Click "Allow Microphone" to enable voice recognition.</p>
                </div>
                <Button onClick={requestMicrophonePermission} size="sm">
                  Allow Microphone
                </Button>
              </div>
            </div>
          )}

          {/* TTS Mode Toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <span className="text-sm font-medium">Audio Output:</span>
            <div className="flex items-center gap-2">
              <Button onClick={toggleTTSMode} variant={useNativeTTS ? "default" : "outline"} size="sm">
                {useNativeTTS ? "🔊 Native TTS" : "🎵 Custom Audio"}
              </Button>
              {isSpeaking && (
                <Button onClick={stopSpeaking} variant="outline" size="sm">
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Browser Compatibility Notice */}
          {!speechSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-yellow-700 text-sm">
                  Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari for best
                  experience.
                </p>
              </div>
            </div>
          )}

          {/* Initialization Status */}
          {!workersReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-blue-700 text-sm">{initializationStatus}</p>
              </div>
            </div>
          )}

          {/* Main Control Button */}
          <div className="flex justify-center">
            <Button
              onClick={toggleListening}
              disabled={isProcessing || !workersReady || microphonePermission === "denied"}
              size="lg"
              className={`w-32 h-32 rounded-full transition-all duration-200 ${
                isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
              } ${microphonePermission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="text-center">
            {!workersReady && <p className="text-blue-600 font-medium">Loading AI models...</p>}
            {microphonePermission === "denied" && (
              <p className="text-red-600 font-medium">🚫 Microphone access denied</p>
            )}
            {microphonePermission === "prompt" && (
              <p className="text-yellow-600 font-medium">🎤 Click "Allow Microphone" above</p>
            )}
            {workersReady && microphonePermission === "granted" && isListening && (
              <p className="text-green-600 font-medium">🎙️ Listening...</p>
            )}
            {workersReady && microphonePermission === "granted" && isProcessing && !isSpeaking && (
              <p className="text-blue-600 font-medium">🧠 Processing...</p>
            )}
            {workersReady && microphonePermission === "granted" && isSpeaking && (
              <p className="text-green-600 font-medium">🔊 Speaking response...</p>
            )}
            {workersReady && microphonePermission === "granted" && !isListening && !isProcessing && !isSpeaking && (
              <p className="text-gray-600">Tap the microphone to start speaking</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm">{error}</p>
                  <Button
                    onClick={clearError}
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">🗣️ You said:</h3>
              <p className="text-gray-700">{transcript}</p>
            </div>
          )}

          {/* AI Response */}
          {response && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-medium text-blue-900 mb-2">🤖 AI Response:</h3>
              <p className="text-blue-700">{response}</p>
            </div>
          )}

          {/* Performance Metrics */}
          {metrics && (
            <div className="bg-green-50 rounded-lg p-3">
              <h3 className="font-medium text-green-900 mb-2">⚡ Performance:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>STT: {(metrics.sttLatency || 0).toFixed(0)}ms</div>
                <div>API: {(metrics.apiLatency || 0).toFixed(0)}ms</div>
                <div>TTS: {(metrics.ttsLatency || 0).toFixed(0)}ms</div>
                <div
                  className={`font-medium ${(metrics.totalLatency || 0) < 1200 ? "text-green-700" : "text-orange-700"}`}
                >
                  Total: {(metrics.totalLatency || 0).toFixed(0)}ms
                </div>
              </div>
              {(metrics.totalLatency || 0) < 1200 && (
                <p className="text-xs text-green-600 mt-1">🎯 Target achieved (&lt;1.2s)</p>
              )}
            </div>
          )}

          {/* Instructions */}
          {workersReady && !transcript && !response && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">How to use:</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Allow microphone access when prompted</li>
                <li>2. Click the microphone button</li>
                <li>3. Speak your question or message clearly</li>
                <li>4. Click again to stop recording</li>
                <li>5. Listen to the AI's voice response</li>
              </ol>
              {speechSupported && microphonePermission === "granted" && (
                <p className="text-xs text-green-600 mt-2">
                  ✅ Using browser's built-in speech recognition and TTS for better quality
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
