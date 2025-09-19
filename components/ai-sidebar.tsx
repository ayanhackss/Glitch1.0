"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Send, Sparkles, Brain, MessageSquare, Lightbulb } from "lucide-react"
import type { CodeError } from "./code-debugger"

interface AISidebarProps {
  code: string
  language: string
  errors: CodeError[]
  onAIQuery?: () => void
}

interface AIMessage {
  id: string
  type: "user" | "ai"
  content: string
  reasoning?: string
  timestamp: Date
}

export function AISidebar({ code, language, errors, onAIQuery }: AISidebarProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      type: "ai",
      content: `Hello! I'm your AI debugging assistant powered by DeepSeek V3.1. I can help you understand and fix errors in your ${language} code. Feel free to ask me anything!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Track AI query
    onAIQuery?.()

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      let response: any

      if (activeTab === "debug") {
        response = await fetch("/api/ai/debug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            errors: errors.map((e) => ({ line: e.line, message: e.message, suggestion: e.suggestion })),
            query: currentInput,
          }),
        })
      } else if (activeTab === "reason") {
        response = await fetch("/api/ai/reason", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            problem: currentInput,
          }),
        })
      } else {
        response = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            question: currentInput,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: activeTab === "reason" ? data.answer : data.response,
        reasoning: activeTab === "reason" ? data.reasoning : undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("AI request failed:", error)
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "Sorry, I encountered an error while processing your request. Please make sure the DeepSeek API key is configured and try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: string, mode: "debug" | "explain" | "reason" = "debug") => {
    setActiveTab(mode)
    setInput(action)
  }

  const handleAutoDebug = async () => {
    if (errors.length === 0) return

    onAIQuery?.()
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          errors: errors.map((e) => ({ line: e.line, message: e.message, suggestion: e.suggestion })),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const aiResponse: AIMessage = {
          id: Date.now().toString(),
          type: "ai",
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
      }
    } catch (error) {
      console.error("Auto debug failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-sidebar-primary" />
          <h3 className="font-medium text-sidebar-foreground">AI Assistant</h3>
          <Sparkles className="h-4 w-4 text-sidebar-accent" />
        </div>

        {errors.length > 0 && (
          <Card className="p-3 bg-sidebar-accent/10 border-sidebar-accent/20 mb-3">
            <p className="text-xs text-sidebar-foreground mb-2">
              I detected {errors.length} issue{errors.length > 1 ? "s" : ""} in your code
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 bg-transparent w-full"
              onClick={handleAutoDebug}
              disabled={isLoading}
            >
              <Bot className="h-3 w-3 mr-1" />
              Auto Debug
            </Button>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="chat" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="debug" className="text-xs">
              <Bot className="h-3 w-3 mr-1" />
              Debug
            </TabsTrigger>
            <TabsTrigger value="reason" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Reason
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  message.type === "user"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "bg-sidebar-accent/10 text-sidebar-foreground border border-sidebar-border"
                }`}
              >
                {message.reasoning && (
                  <div className="mb-3 p-2 bg-sidebar-accent/5 rounded border-l-2 border-sidebar-accent">
                    <div className="flex items-center gap-1 text-xs font-medium mb-1 text-sidebar-accent">
                      <Brain className="h-3 w-3" />
                      AI Reasoning
                    </div>
                    <p className="text-xs text-sidebar-foreground/80 whitespace-pre-wrap">{message.reasoning}</p>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-sidebar-accent/10 text-sidebar-foreground border border-sidebar-border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-sidebar-accent border-t-transparent rounded-full" />
                  {activeTab === "reason" ? "AI is reasoning..." : "AI is thinking..."}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex gap-1 mb-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 flex-1 bg-transparent"
            onClick={() => handleQuickAction("Explain my code", "explain")}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            Explain
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 flex-1 bg-transparent"
            onClick={() => handleQuickAction("Help me fix the errors", "debug")}
          >
            <Bot className="h-3 w-3 mr-1" />
            Debug
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 flex-1 bg-transparent"
            onClick={() => handleQuickAction("Analyze this code deeply", "reason")}
          >
            <Brain className="h-3 w-3 mr-1" />
            Reason
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeTab === "debug"
                ? "Ask about errors..."
                : activeTab === "reason"
                  ? "Describe the problem..."
                  : "Ask me anything..."
            }
            className="flex-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button size="sm" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-sidebar-foreground/60 mt-2 text-center">
          Powered by DeepSeek V3.1 • {activeTab === "reason" ? "Reasoning Mode" : "Chat Mode"}
        </p>
      </div>
    </div>
  )
}
