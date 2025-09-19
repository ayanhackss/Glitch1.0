import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/lib/deepseek-client"

export async function POST(request: NextRequest) {
  try {
    const { code, language, errors, query } = await request.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    console.log("[v0] API key exists:", !!apiKey)
    console.log("[v0] API key length:", apiKey?.length || 0)

    if (!apiKey) {
      console.error("[v0] OpenRouter API key not found in environment variables")
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    console.log("[v0] Creating DeepSeek client and making debug request")
    const client = new DeepSeekClient(apiKey)
    const response = await client.debugCode(code, language, errors, query)

    console.log("[v0] Debug request successful")
    return NextResponse.json({ response })
  } catch (error) {
    console.error("[v0] Debug API error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Network error")) {
        return NextResponse.json(
          {
            error: "Unable to connect to OpenRouter API. Please check your internet connection and try again.",
          },
          { status: 503 },
        )
      }
      if (error.message.includes("OpenRouter API error")) {
        return NextResponse.json(
          {
            error: `API Error: ${error.message}`,
          },
          { status: 502 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process debug request. Please try again.",
      },
      { status: 500 },
    )
  }
}
