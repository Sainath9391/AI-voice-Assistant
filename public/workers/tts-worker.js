// TTS Web Worker for local text-to-speech
let isInitialized = false

self.onmessage = async (event) => {
  const { type, data } = event.data

  switch (type) {
    case "init":
      try {
        // Simulate TTS model loading
        await new Promise((resolve) => setTimeout(resolve, 1500))
        isInitialized = true

        self.postMessage({
          type: "initialized",
          success: true,
        })
      } catch (error) {
        self.postMessage({
          type: "error",
          error: `Failed to initialize TTS: ${error}`,
        })
      }
      break

    case "synthesize":
      if (!isInitialized) {
        self.postMessage({
          type: "error",
          error: "TTS not initialized",
        })
        return
      }

      try {
        const startTime = performance.now()

        // Simulate speech synthesis processing time
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Generate simple audio data (sine wave as placeholder)
        const sampleRate = 22050
        const duration = Math.min(data.text.length * 0.08, 4) // Dynamic duration based on text length
        const samples = Math.floor(sampleRate * duration)
        const audioData = new Float32Array(samples)

        // Generate a more pleasant tone sequence
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate
          const frequency = 200 + Math.sin(t * 2) * 50 // Varying frequency
          audioData[i] = Math.sin(2 * Math.PI * frequency * t) * 0.2 * Math.exp(-t * 0.5)
        }

        const endTime = performance.now()
        const latency = endTime - startTime

        self.postMessage({
          type: "audio",
          audioBuffer: audioData.buffer,
          latency,
        })
      } catch (error) {
        self.postMessage({
          type: "error",
          error: `Speech synthesis failed: ${error}`,
        })
      }
      break

    case "cleanup":
      isInitialized = false
      break
  }
}
