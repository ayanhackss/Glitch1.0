"use client"

import { useState, useEffect } from "react"
import { Header } from "./header"
import { CodeEditor } from "./code-editor"
import { ErrorPanel } from "./error-panel"
import { AISidebar } from "./ai-sidebar"
import { EnvSetup } from "./env-setup"
import { CodeComparison } from "./code-comparison"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { analytics } from "@/lib/analytics"
import { useAuth } from "./auth-provider"
import { detectLanguage, getLanguageConfidence } from "@/lib/language-detector"
import { Wand2, Zap } from "lucide-react"

export interface CodeError {
  line: number
  column: number
  message: string
  type: "error" | "warning" | "info"
  severity: "high" | "medium" | "low"
  suggestion?: string
}

interface FixResult {
  fixedCode: string
  explanation: string
  changes: string[]
  issuesFound: string[]
}

export function CodeDebugger() {
  const { user } = useAuth()
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [languageConfidence, setLanguageConfidence] = useState(0)
  const [errors, setErrors] = useState<CodeError[]>([])
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)

  useEffect(() => {
    // Start analytics session with user ID if available
    const id = analytics.startSession(language, user?.id)
    setSessionId(id)

    return () => {
      analytics.endSession()
    }
  }, [user?.id])

  useEffect(() => {
    // Track language changes
    if (sessionId) {
      analytics.trackEvent({
        event: "code_check",
        language,
        userId: user?.id,
        metadata: { codeLength: code.length },
      })
    }
  }, [language, sessionId, user?.id])

  useEffect(() => {
    if (code.trim()) {
      const detected = detectLanguage(code)
      const confidence = getLanguageConfidence(code, detected)

      setDetectedLanguage(detected)
      setLanguageConfidence(confidence)

      // Auto-switch language if confidence is high and different from current
      if (confidence > 0.7 && detected !== language) {
        setLanguage(detected)
      }
    } else {
      setDetectedLanguage(null)
      setLanguageConfidence(0)
    }
  }, [code])

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    if (sessionId) {
      analytics.trackEvent({
        event: "code_check",
        language,
        userId: user?.id,
        metadata: { codeLength: newCode.length },
      })
    }
  }

  const handleErrorsChange = (newErrors: CodeError[]) => {
    // Track new errors
    const previousErrorCount = errors.length
    const newErrorCount = newErrors.length

    if (newErrorCount > previousErrorCount && sessionId) {
      // New errors detected
      newErrors.slice(previousErrorCount).forEach((error) => {
        analytics.trackEvent({
          event: "error_detected",
          language,
          userId: user?.id,
          errorType: error.type,
          errorMessage: error.message,
          metadata: {
            line: error.line,
            severity: error.severity,
          },
        })
      })
    } else if (newErrorCount < previousErrorCount && sessionId) {
      // Errors fixed
      const fixedCount = previousErrorCount - newErrorCount
      for (let i = 0; i < fixedCount; i++) {
        analytics.trackEvent({
          event: "code_fixed",
          language,
          userId: user?.id,
          metadata: { errorsRemaining: newErrorCount },
        })
      }
    }

    setErrors(newErrors)
  }

  const handleFixWithAI = async () => {
    if (!code.trim() || errors.length === 0) return

    setIsFixing(true)
    try {
      const response = await fetch("/api/ai/fix-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          errors,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fix code")
      }

      const result = await response.json()
      setFixResult(result)

      // Track AI fix usage
      if (sessionId) {
        analytics.trackEvent({
          event: "ai_fix_used",
          language,
          userId: user?.id,
          metadata: {
            errorCount: errors.length,
            codeLength: code.length,
          },
        })
      }
    } catch (error) {
      console.error("Error fixing code:", error)
    } finally {
      setIsFixing(false)
    }
  }

  const handleApplyFix = (fixedCode: string) => {
    setCode(fixedCode)
    setFixResult(null)

    // Track fix application
    if (sessionId) {
      analytics.trackEvent({
        event: "ai_fix_applied",
        language,
        userId: user?.id,
        metadata: {
          originalLength: code.length,
          fixedLength: fixedCode.length,
        },
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onAIToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
        isAIOpen={isAISidebarOpen}
      />

      <EnvSetup />

      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          {detectedLanguage && detectedLanguage !== language && (
            <Badge variant="outline" className="text-xs">
              Detected: {detectedLanguage} ({Math.round(languageConfidence * 100)}% confidence)
            </Badge>
          )}
          {errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errors.length} error{errors.length !== 1 ? "s" : ""} found
            </Badge>
          )}
        </div>

        {errors.length > 0 && (
          <Button
            onClick={handleFixWithAI}
            disabled={isFixing || !code.trim()}
            className="flex items-center gap-2"
            size="sm"
          >
            {isFixing ? (
              <>
                <Zap className="h-4 w-4 animate-pulse" />
                Fixing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Fix with AI
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <CodeEditor
              code={code}
              language={language}
              onChange={handleCodeChange}
              onErrorsChange={handleErrorsChange}
            />
          </div>

          {errors.length > 0 && (
            <div className="h-64 border-t border-border">
              <ErrorPanel errors={errors} language={language} />
            </div>
          )}
        </div>

        {isAISidebarOpen && (
          <div className="w-80 border-l border-border">
            <AISidebar
              code={code}
              language={language}
              errors={errors}
              onAIQuery={() => {
                if (sessionId) {
                  analytics.trackEvent({
                    event: "ai_query",
                    language,
                    userId: user?.id,
                    metadata: { errorCount: errors.length },
                  })
                }
              }}
            />
          </div>
        )}
      </div>

      {fixResult && (
        <CodeComparison
          originalCode={code}
          fixedCode={fixResult.fixedCode}
          language={language}
          explanation={fixResult.explanation}
          changes={fixResult.changes}
          issuesFound={fixResult.issuesFound}
          onApplyFix={handleApplyFix}
          onClose={() => setFixResult(null)}
        />
      )}
    </div>
  )
}
