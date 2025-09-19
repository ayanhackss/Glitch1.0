import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/lib/deepseek-client"

export async function POST(request: NextRequest) {
  try {
    const { code, language, problem } = await request.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    const client = new DeepSeekClient(apiKey)
    const response = await client.reasonAboutCode(code, language, problem)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Reason API error:", error)
    return NextResponse.json({ error: "Failed to process reasoning request" }, { status: 500 })
  }
}
