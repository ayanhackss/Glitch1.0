"use client"

import { useState } from "react"
import { AlertCircle, AlertTriangle, Info, X, Wrench, ChevronRight, ChevronDown, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { CodeError } from "./code-debugger"

interface DetailedErrorPanelProps {
  errors: CodeError[]
  language: string
  code: string
  onFixError: (errorIndex: number, fixedCode: string) => void
  onClose: () => void
}

interface ErrorFix {
  description: string
  code: string
  explanation: string
}

export function DetailedErrorPanel({ errors, language, code, onFixError, onClose }: DetailedErrorPanelProps) {
  const [selectedError, setSelectedError] = useState<number>(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    solution: true,
    examples: false,
    prevention: false,
  })

  const getErrorIcon = (type: CodeError["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-accent" />
      case "info":
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const getSeverityColor = (severity: CodeError["severity"]) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
    }
  }

  const generateErrorFix = (error: CodeError, code: string): ErrorFix | null => {
    const lines = code.split("\n")
    const errorLine = lines[error.line - 1]

    if (!errorLine) return null

    // Generate fixes based on error message and language
    if (error.message.includes("Missing semicolon")) {
      return {
        description: "Add semicolon at end of statement",
        code: errorLine + ";",
        explanation:
          "Semicolons are required to terminate statements in " +
          language.toUpperCase() +
          ". This helps the parser understand where one statement ends and another begins.",
      }
    }

    if (error.message.includes("not declared") && language === "javascript") {
      const varMatch = errorLine.match(/(\w+)\s*=/)
      if (varMatch) {
        return {
          description: "Declare variable with const",
          code: errorLine.replace(varMatch[1], `const ${varMatch[1]}`),
          explanation:
            "Variables should be declared before use. 'const' is preferred for values that won't be reassigned, 'let' for values that will change.",
        }
      }
    }

    if (error.message.includes("Print statement requires parentheses") && language === "python") {
      const printMatch = errorLine.match(/print\s+(.+)/)
      if (printMatch) {
        return {
          description: "Add parentheses to print statement",
          code: errorLine.replace(/print\s+(.+)/, "print($1)"),
          explanation:
            "Python 3 requires parentheses around print arguments. This change from Python 2 makes print a function rather than a statement.",
        }
      }
    }

    if (error.message.includes("Missing colon") && language === "python") {
      return {
        description: "Add colon after control structure",
        code: errorLine + ":",
        explanation:
          "Python control structures (if, for, while, def, class) require a colon at the end to indicate the start of an indented block.",
      }
    }

    if (error.message.includes("PHP variables must start with $") && language === "php") {
      const varMatch = errorLine.match(/(\w+)\s*=/)
      if (varMatch) {
        return {
          description: "Add $ prefix to variable",
          code: errorLine.replace(varMatch[1], `$${varMatch[1]}`),
          explanation:
            "In PHP, all variables must be prefixed with the $ symbol. This distinguishes variables from constants and function names.",
        }
      }
    }

    if (error.message.includes("Missing opening brace")) {
      return {
        description: "Add opening brace after function declaration",
        code: errorLine + " {",
        explanation:
          "Function declarations require opening braces to define the function body. The brace should be on the same line or the next line depending on your coding style.",
      }
    }

    return null
  }

  const getErrorExamples = (error: CodeError, language: string): { wrong: string; correct: string } => {
    if (error.message.includes("Missing semicolon")) {
      return {
        wrong: "let x = 5\nconsole.log(x)",
        correct: "let x = 5;\nconsole.log(x);",
      }
    }

    if (error.message.includes("not declared")) {
      return {
        wrong: "x = 5;\nconsole.log(x);",
        correct: "const x = 5;\nconsole.log(x);",
      }
    }

    if (error.message.includes("Print statement requires parentheses")) {
      return {
        wrong: 'print "Hello World"',
        correct: 'print("Hello World")',
      }
    }

    if (error.message.includes("Missing colon")) {
      return {
        wrong: 'if x > 5\n    print("Greater")',
        correct: 'if x > 5:\n    print("Greater")',
      }
    }

    return {
      wrong: "// Example of incorrect code",
      correct: "// Example of correct code",
    }
  }

  const getPreventionTips = (error: CodeError, language: string): string[] => {
    const tips: string[] = []

    if (error.message.includes("Missing semicolon")) {
      tips.push("Use a linter like ESLint to catch missing semicolons automatically")
      tips.push("Configure your editor to show syntax highlighting for incomplete statements")
      tips.push("Consider using Prettier to automatically format your code")
    }

    if (error.message.includes("not declared")) {
      tips.push("Always declare variables before using them")
      tips.push("Use 'const' by default, 'let' when you need to reassign")
      tips.push("Enable strict mode in JavaScript with 'use strict'")
    }

    if (error.message.includes("Print statement requires parentheses")) {
      tips.push("Remember that Python 3 treats print as a function, not a statement")
      tips.push("Use a Python 3 compatible IDE that highlights syntax errors")
      tips.push("Run your code with Python 3 interpreter to catch these errors early")
    }

    if (error.message.includes("Missing colon")) {
      tips.push("Python's indentation-based syntax requires colons after control structures")
      tips.push("Use an IDE with Python syntax highlighting")
      tips.push("Practice writing control structures to build muscle memory")
    }

    return tips.length > 0
      ? tips
      : [
          "Follow language-specific best practices",
          "Use proper IDE with syntax highlighting",
          "Test your code frequently",
        ]
  }

  const handleFixError = () => {
    const error = errors[selectedError]
    const fix = generateErrorFix(error, code)

    if (fix) {
      const lines = code.split("\n")
      lines[error.line - 1] = fix.code
      const fixedCode = lines.join("\n")
      onFixError(selectedError, fixedCode)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (errors.length === 0) {
    return (
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium">Error Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div className="text-muted-foreground">
            <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No errors detected</p>
            <p className="text-xs mt-1">Your code looks good!</p>
          </div>
        </div>
      </div>
    )
  }

  const currentError = errors[selectedError]
  const errorFix = generateErrorFix(currentError, code)
  const examples = getErrorExamples(currentError, language)
  const preventionTips = getPreventionTips(currentError, language)

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Error Details</h3>
          <Badge variant="secondary" className="text-xs">
            {selectedError + 1} of {errors.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Error List */}
      <div className="border-b border-border">
        <ScrollArea className="h-32">
          <div className="p-2 space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`p-2 rounded-md cursor-pointer transition-colors text-sm ${
                  selectedError === index ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedError(index)}
              >
                <div className="flex items-start gap-2">
                  {getErrorIcon(error.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{error.message}</p>
                    <p className="text-xs text-muted-foreground">
                      Line {error.line}, Column {error.column}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Error Details */}
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-2">
          {getErrorIcon(currentError.type)}
          <h4 className="text-sm font-medium">{currentError.message}</h4>
        </div>
        <div className="text-sm text-muted-foreground">
          Line {currentError.line}, Column {currentError.column}
        </div>

        {/* Solution Section */}
        <Collapsible open={expandedSections.solution} onOpenChange={() => toggleSection("solution")}>
          <CollapsibleTrigger className="flex items-center justify-between text-sm font-medium">
            Solution
            {expandedSections.solution ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            {errorFix ? (
              <div className="flex flex-col space-y-2">
                <p className="text-sm">{errorFix.description}</p>
                <pre className="bg-muted p-2 rounded-md text-sm">
                  <code>{errorFix.code}</code>
                </pre>
                <p className="text-sm text-muted-foreground">{errorFix.explanation}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No solution available for this error.</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Examples Section */}
        <Collapsible open={expandedSections.examples} onOpenChange={() => toggleSection("examples")}>
          <CollapsibleTrigger className="flex items-center justify-between text-sm font-medium">
            Examples
            {expandedSections.examples ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="flex flex-col space-y-2">
              <p className="text-sm">Incorrect:</p>
              <pre className="bg-muted p-2 rounded-md text-sm">
                <code>{examples.wrong}</code>
              </pre>
              <p className="text-sm">Correct:</p>
              <pre className="bg-muted p-2 rounded-md text-sm">
                <code>{examples.correct}</code>
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Prevention Section */}
        <Collapsible open={expandedSections.prevention} onOpenChange={() => toggleSection("prevention")}>
          <CollapsibleTrigger className="flex items-center justify-between text-sm font-medium">
            Prevention Tips
            {expandedSections.prevention ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {preventionTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {/* Fix Button */}
        {errorFix && (
          <Button variant="default" onClick={handleFixError}>
            <Wrench className="h-4 w-4 mr-2" />
            Fix Error
          </Button>
        )}
      </div>
    </div>
  )
}
