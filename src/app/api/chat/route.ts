import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    const result = streamText({
      model: openai("gpt-4o"),
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
      maxTokens: 100,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
