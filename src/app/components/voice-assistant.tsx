"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceMetrics {
  sttLatency: number
  apiLatency: number
  ttsLatency: number
  totalLatency: number
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workersReady, setWorkersReady] = useState(false)
  const [initializationStatus, setInitializationStatus] = useState("Initializing...")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const whisperWorkerRef = useRef<Worker | null>(null)
  const ttsWorkerRef = useRef<Worker | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize workers and audio context
  useEffect(() => {
    initializeWorkers()
    return () => {
      cleanupWorkers()
    }
  }, [])

  const initializeWorkers = async () => {
    try {
      setInitializationStatus("Loading Whisper model...")

      // Initialize Whisper worker
      whisperWorkerRef.current = new Worker("/workers/whisper-worker.js")
      whisperWorkerRef.current.postMessage({ type: "init" })

      setInitializationStatus("Loading TTS model...")

      // Initialize TTS worker
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
          playAudio(audioBuffer, latency)
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
      setIsListening(true)
      setTranscript("")
      setResponse("")
      setMetrics(null)
      audioChunksRef.current = []

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
    } catch (err) {
      setError("Failed to access microphone. Please allow microphone access.")
      setIsListening(false)
      console.error("Microphone access error:", err)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
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
      // For demo purposes, we'll just send a signal to the worker
      // In production, you'd convert the audio properly
      if (whisperWorkerRef.current) {
        whisperWorkerRef.current.postMessage({
          type: "transcribe",
          data: { audioData: new Float32Array(1024), isFinal: true },
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

      // Send to TTS worker
      if (ttsWorkerRef.current && aiResponse.trim()) {
        ttsWorkerRef.current.postMessage({
          type: "synthesize",
          data: { text: aiResponse },
        })
      }

      setMetrics(
        (prev) =>
          ({
            ...prev,
            sttLatency,
            apiLatency,
            totalLatency: 0,
          }) as PerformanceMetrics,
      )
    } catch (err) {
      setError("Failed to get AI response. Check your API key.")
      setIsProcessing(false)
      console.error("AI response error:", err)
    }
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

      const playbackStartTime = performance.now()
      source.start()

      setMetrics((prev) => {
        if (!prev) return null
        const totalLatency = prev.sttLatency + prev.apiLatency + ttsLatency
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
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isProcessing || !workersReady}
              size="lg"
              className={`w-32 h-32 rounded-full transition-all duration-200 ${
                isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
              }`}
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
            {workersReady && isListening && <p className="text-green-600 font-medium">🎙️ Listening...</p>}
            {workersReady && isProcessing && <p className="text-blue-600 font-medium">🧠 Processing...</p>}
            {workersReady && !isListening && !isProcessing && (
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
                <div>STT: {metrics.sttLatency.toFixed(0)}ms</div>
                <div>API: {metrics.apiLatency.toFixed(0)}ms</div>
                <div>TTS: {metrics.ttsLatency.toFixed(0)}ms</div>
                <div className={`font-medium ${metrics.totalLatency < 1200 ? "text-green-700" : "text-orange-700"}`}>
                  Total: {metrics.totalLatency.toFixed(0)}ms
                </div>
              </div>
              {metrics.totalLatency < 1200 && (
                <p className="text-xs text-green-600 mt-1">🎯 Target achieved (&lt;1.2s)</p>
              )}
            </div>
          )}

          {/* Instructions */}
          {workersReady && !transcript && !response && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">How to use:</h3>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Click the microphone button</li>
                <li>2. Speak your question or message</li>
                <li>3. Click again to stop recording</li>
                <li>4. Wait for AI response and audio playback</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
