interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      reasoning_content?: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class DeepSeekClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = "https://openrouter.ai/api/v1"
  }

  async chat(
    messages: DeepSeekMessage[],
    model: "deepseek/deepseek-chat-v3.1" | "deepseek/deepseek-reasoner-v3.1" = "deepseek/deepseek-chat-v3.1",
    options?: {
      temperature?: number
      max_tokens?: number
      stream?: boolean
    },
  ): Promise<DeepSeekResponse> {
    console.log("[v0] Making OpenRouter API request to:", `${this.baseUrl}/chat/completions`)
    console.log("[v0] Using model:", model)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://v0.dev",
          "X-Title": "Code Debugger by Ayan & Abhishek",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 1000,
          stream: options?.stream ?? false,
        }),
      })

      console.log("[v0] OpenRouter response status:", response.status)
      console.log("[v0] OpenRouter response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] OpenRouter API error response:", errorText)
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] OpenRouter API success, response received")
      return data
    } catch (error) {
      console.error("[v0] Fetch error details:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(`Network error: Unable to connect to OpenRouter API. Please check your internet connection.`)
      }
      throw error
    }
  }

  async debugCode(
    code: string,
    language: string,
    errors: Array<{ line: number; message: string; suggestion?: string }>,
    userQuery?: string,
  ): Promise<string> {
    console.log("[v0] Starting debugCode with language:", language)

    const systemPrompt = `You are an expert code debugging assistant. You help beginner programmers understand and fix their code errors in a friendly, educational way.

Language: ${language}
Your role:
1. Explain errors in simple, beginner-friendly English
2. Provide clear, actionable fix suggestions
3. Teach best practices and common patterns
4. Be encouraging and supportive

Always format your responses with:
- Clear explanations of what went wrong
- Step-by-step fix instructions
- Code examples when helpful
- Tips to prevent similar issues`

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here's my ${language} code:

\`\`\`${language}
${code}
\`\`\`

${
  errors.length > 0
    ? `Detected errors:
${errors.map((e) => `- Line ${e.line}: ${e.message}${e.suggestion ? ` (Suggestion: ${e.suggestion})` : ""}`).join("\n")}`
    : "No errors detected."
}

${userQuery ? `User question: ${userQuery}` : "Please help me understand any issues and how to improve this code."}`,
      },
    ]

    try {
      const response = await this.chat(messages, "deepseek/deepseek-chat-v3.1")
      return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
    } catch (error) {
      console.error("[v0] debugCode error:", error)
      throw error // Re-throw to let the API route handle it
    }
  }

  async explainCode(code: string, language: string, specificQuestion?: string): Promise<string> {
    const systemPrompt = `You are a helpful programming tutor. Explain code in a clear, educational way for beginners.

Focus on:
1. What the code does overall
2. How each part works
3. Key concepts and patterns used
4. Best practices demonstrated
5. Suggestions for improvement`

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please explain this ${language} code:

\`\`\`${language}
${code}
\`\`\`

${specificQuestion ? `Specific question: ${specificQuestion}` : ""}`,
      },
    ]

    try {
      const response = await this.chat(messages, "deepseek/deepseek-chat-v3.1")
      return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
    } catch (error) {
      console.error("OpenRouter API error:", error)
      return "I'm having trouble connecting to the AI service right now. Please try again later."
    }
  }

  async reasonAboutCode(
    code: string,
    language: string,
    problem: string,
  ): Promise<{ reasoning: string; answer: string }> {
    const systemPrompt = `You are an expert code analyst. Use deep reasoning to understand complex code problems and provide thorough solutions.`

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this ${language} code and solve the following problem:

Code:
\`\`\`${language}
${code}
\`\`\`

Problem: ${problem}

Please think through this step by step and provide a comprehensive solution.`,
      },
    ]

    try {
      const response = await this.chat(messages, "deepseek/deepseek-reasoner-v3.1")
      const choice = response.choices[0]
      return {
        reasoning: choice?.message?.reasoning_content || "",
        answer: choice?.message?.content || "Sorry, I couldn't generate a response.",
      }
    } catch (error) {
      console.error("OpenRouter API error:", error)
      return {
        reasoning: "",
        answer: "I'm having trouble connecting to the AI service right now. Please try again later.",
      }
    }
  }

  async fixCode(
    code: string,
    language: string,
    errors: Array<{ line: number; message: string; suggestion?: string }>,
  ): Promise<{
    fixedCode: string
    issues: Array<{ issue: string; fix: string; line?: number }>
    explanation: string
  }> {
    const systemPrompt = `You are an expert code fixing assistant. Your task is to:
1. Analyze the provided code and fix all errors
2. Provide clear explanations of issues and fixes
3. Return ONLY valid JSON in the exact format specified

CRITICAL: You must respond with ONLY valid JSON. No markdown, no explanations outside the JSON, no code blocks.

Required JSON format:
{
  "fixedCode": "the complete corrected code here",
  "issues": [
    {
      "issue": "clear description of what was wrong",
      "fix": "description of how it was fixed",
      "line": 1
    }
  ],
  "explanation": "overall explanation of all changes made"
}

If no issues are found, still provide the JSON with empty issues array and explanation that code looks good.`

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Fix this ${language} code and respond with ONLY valid JSON:

\`\`\`${language}
${code}
\`\`\`

${
  errors.length > 0
    ? `Detected errors:
${errors.map((e) => `- Line ${e.line}: ${e.message}${e.suggestion ? ` (Suggestion: ${e.suggestion})` : ""}`).join("\n")}`
    : "Please review and fix any issues you find."
}

Remember: Respond with ONLY valid JSON, no other text.`,
      },
    ]

    try {
      const response = await this.chat(messages, "deepseek/deepseek-chat-v3.1", {
        temperature: 0.1, // Even lower temperature for more consistent output
      })

      const content = response.choices[0]?.message?.content || ""
      console.log("[v0] Raw AI response:", content)

      let jsonContent = content.trim()

      // Remove markdown code blocks if present
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      // Find JSON object if there's extra text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      console.log("[v0] Extracted JSON:", jsonContent)

      try {
        const parsed = JSON.parse(jsonContent)

        return {
          fixedCode: parsed.fixedCode || code,
          issues: Array.isArray(parsed.issues)
            ? parsed.issues
            : [{ issue: "Code analysis completed", fix: "No specific issues found", line: 1 }],
          explanation: parsed.explanation || "Code has been reviewed and processed.",
        }
      } catch (parseError) {
        console.error("[v0] JSON parse error:", parseError)
        console.error("[v0] Failed to parse content:", jsonContent)

        return {
          fixedCode: code,
          issues: [
            {
              issue: "AI response format error",
              fix: "The AI provided analysis but in an unexpected format. Please try again.",
              line: 1,
            },
          ],
          explanation: "There was an issue processing the AI response format. The original code has been preserved.",
        }
      }
    } catch (error) {
      console.error("[v0] OpenRouter API error:", error)
      return {
        fixedCode: code,
        issues: [
          {
            issue: "API connection failed",
            fix: "Please check your internet connection and API key, then try again",
            line: 1,
          },
        ],
        explanation: "Unable to connect to the AI service. Please verify your connection and try again.",
      }
    }
  }
}
