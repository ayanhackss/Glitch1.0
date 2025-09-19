import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/lib/deepseek-client"

export async function POST(request: NextRequest) {
  try {
    const { code, language, question } = await request.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    const client = new DeepSeekClient(apiKey)
    const response = await client.explainCode(code, language, question)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Explain API error:", error)
    return NextResponse.json({ error: "Failed to process explain request" }, { status: 500 })
  }
}
