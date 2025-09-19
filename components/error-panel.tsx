"use client"

import { AlertCircle, AlertTriangle, Info, X, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LearningMode } from "./learning-mode"
import { useState } from "react"
import type { CodeError } from "./code-debugger"

interface ErrorPanelProps {
  errors: CodeError[]
  language: string
}

export function ErrorPanel({ errors, language }: ErrorPanelProps) {
  const [showLearningMode, setShowLearningMode] = useState(true)

  const getErrorIcon = (type: CodeError["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-accent" />
      case "info":
        return <Info className="h-4 w-4 text-primary" />
    }
  }

  const getSeverityColor = (severity: CodeError["severity"]) => {
    switch (severity) {
      case "high":
        return "border-l-destructive"
      case "medium":
        return "border-l-accent"
      case "low":
        return "border-l-primary"
    }
  }

  const copyError = (error: CodeError) => {
    const errorText = `Line ${error.line}: ${error.message}${error.suggestion ? `\nSuggestion: ${error.suggestion}` : ""}`
    navigator.clipboard.writeText(errorText)
  }

  const errorCounts = {
    error: errors.filter((e) => e.type === "error").length,
    warning: errors.filter((e) => e.type === "warning").length,
    info: errors.filter((e) => e.type === "info").length,
  }

  return (
    <div className="h-full bg-muted/30 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium">Problems ({errors.length})</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {errorCounts.error > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                {errorCounts.error}
              </span>
            )}
            {errorCounts.warning > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-accent" />
                {errorCounts.warning}
              </span>
            )}
            {errorCounts.info > 0 && (
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3 text-primary" />
                {errorCounts.info}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowLearningMode(!showLearningMode)}>
            Learning Mode
          </Button>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border-l-2 bg-card hover:bg-accent/10 cursor-pointer transition-colors group ${getSeverityColor(error.severity)}`}
            >
              <div className="flex items-start gap-2">
                {getErrorIcon(error.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{error.message}</span>
                    <span className="text-muted-foreground">
                      Line {error.line}, Column {error.column}
                    </span>
                  </div>
                  {error.suggestion && <p className="text-xs text-muted-foreground mt-1">💡 {error.suggestion}</p>}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyError(error)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {errors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No problems detected</p>
              <p className="text-xs mt-1">Start typing to see real-time error detection</p>
            </div>
          )}
        </div>

        {showLearningMode && errors.length > 0 && (
          <div className="border-t border-border">
            <LearningMode errors={errors} language={language} />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
