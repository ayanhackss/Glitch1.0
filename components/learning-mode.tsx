"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, X, ExternalLink } from "lucide-react"
import type { CodeError } from "./code-debugger"

interface LearningModeProps {
  errors: CodeError[]
  language: string
}

interface LearningTip {
  id: string
  title: string
  description: string
  link?: string
  errorType: string
}

const learningTips: Record<string, LearningTip[]> = {
  javascript: [
    {
      id: "js-semicolon",
      title: "JavaScript Semicolons",
      description:
        "While JavaScript has automatic semicolon insertion, it's best practice to include them explicitly to avoid unexpected behavior.",
      link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Automatic_semicolon_insertion",
      errorType: "Missing semicolon",
    },
    {
      id: "js-variables",
      title: "Variable Declarations",
      description:
        "Always declare variables with 'let', 'const', or 'var' to avoid creating global variables accidentally.",
      link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Declarations",
      errorType: "not declared",
    },
  ],
  python: [
    {
      id: "py-print",
      title: "Python 3 Print Function",
      description: "In Python 3, print is a function and requires parentheses. This is different from Python 2.",
      link: "https://docs.python.org/3/library/functions.html#print",
      errorType: "Print statement",
    },
    {
      id: "py-indentation",
      title: "Python Indentation",
      description: "Python uses indentation to define code blocks. Use 4 spaces per indentation level consistently.",
      link: "https://pep8.org/#indentation",
      errorType: "indentation",
    },
  ],
  cpp: [
    {
      id: "cpp-semicolon",
      title: "C++ Semicolons",
      description: "C++ requires semicolons after most statements. This is mandatory, unlike some other languages.",
      errorType: "Missing semicolon",
    },
    {
      id: "cpp-main",
      title: "Main Function",
      description:
        "The main function should return an int and typically ends with 'return 0;' to indicate successful execution.",
      errorType: "Main function",
    },
  ],
}

export function LearningMode({ errors, language }: LearningModeProps) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())
  const [relevantTips, setRelevantTips] = useState<LearningTip[]>([])

  useEffect(() => {
    const tips = learningTips[language] || []
    const relevant = tips.filter(
      (tip) => errors.some((error) => error.message.includes(tip.errorType)) && !dismissedTips.has(tip.id),
    )
    setRelevantTips(relevant)
  }, [errors, language, dismissedTips])

  const dismissTip = (tipId: string) => {
    setDismissedTips((prev) => new Set([...prev, tipId]))
  }

  if (relevantTips.length === 0) return null

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <BookOpen className="h-4 w-4" />
        Learning Tips
      </div>

      {relevantTips.map((tip) => (
        <Card key={tip.id} className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">{tip.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{tip.description}</p>
              {tip.link && (
                <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent" asChild>
                  <a href={tip.link} target="_blank" rel="noopener noreferrer">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => dismissTip(tip.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
