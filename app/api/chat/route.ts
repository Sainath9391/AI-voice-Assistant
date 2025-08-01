export const maxDuration = 30

export async function POST(req: Request) {
  try {
    console.log("=== API ROUTE DEBUG ===")
    console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
    console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0)

    const { message } = await req.json()
    console.log("Received message:", message)

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ OPENAI_API_KEY is missing!")
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("✅ API key found, making OpenAI request...")

    // Make direct OpenAI API call without AI SDK
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful voice assistant. Keep responses concise and conversational, suitable for speech synthesis. Limit responses to 2-3 sentences maximum.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error("OpenAI API error:", errorData)

      // Check if it's a quota error and provide fallback
      if (errorData.includes("insufficient_quota")) {
        console.log("🔄 Using fallback response due to quota limit")
        const fallbackResponse = getFallbackResponse(message)

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`0:{"textDelta":"${fallbackResponse}"}\n`))
            controller.close()
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        })
      }

      return Response.json({ error: "OpenAI API request failed" }, { status: 500 })
    }

    const data = await openaiResponse.json()
    const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    console.log("✅ OpenAI response:", aiResponse)

    // Return in the format the frontend expects
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:{"textDelta":"${aiResponse}"}\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return Response.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Fallback responses when OpenAI quota is exceeded
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm your voice assistant. How can I help you today?"
  }

  if (lowerMessage.includes("weather")) {
    return "I'd love to help with weather, but I need an active OpenAI connection for real-time data."
  }

  if (lowerMessage.includes("time")) {
    return `The current time is ${new Date().toLocaleTimeString()}.`
  }

  if (lowerMessage.includes("joke")) {
    return "Why don't scientists trust atoms? Because they make up everything!"
  }

  if (lowerMessage.includes("how") && lowerMessage.includes("work")) {
    return "I'm a voice assistant that uses speech recognition, AI processing, and text-to-speech to have conversations with you."
  }

  // Default fallback
  return "I'm currently running in demo mode due to API limits. Please check your OpenAI billing to enable full functionality."
}
