import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/lib/deepseek-client"

export async function POST(request: NextRequest) {
  try {
    const { code, language, errors } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })
    }

    console.log("[v0] API key exists:", !!process.env.OPENROUTER_API_KEY)
    console.log("[v0] API key length:", process.env.OPENROUTER_API_KEY?.length)
    console.log("[v0] Creating DeepSeek client and making fix request")

    const client = new DeepSeekClient(process.env.OPENROUTER_API_KEY)

    const result = await client.fixCode(code, language, errors)

    console.log("[v0] Fix request successful")

    const transformedResult = {
      fixedCode: result.fixedCode,
      explanation: result.explanation,
      changes: result.issues.map((issue) => issue.fix),
      issuesFound: result.issues.map((issue) => issue.issue),
    }

    return NextResponse.json(transformedResult)
  } catch (error) {
    console.error("[v0] Error fixing code:", error)
    return NextResponse.json(
      {
        error: "Failed to fix code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
