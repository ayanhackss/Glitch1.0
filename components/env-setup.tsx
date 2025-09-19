"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Key, ExternalLink } from "lucide-react"

export function EnvSetup() {
  const [showSetup, setShowSetup] = useState(false)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    // Check if API key is configured
    fetch("/api/ai/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "", language: "javascript", errors: [] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error && data.error.includes("API key not configured")) {
          setShowSetup(true)
        }
      })
      .catch(() => {
        // Ignore errors for this check
      })
  }, [])

  if (!showSetup) return null

  return (
    <Card className="m-4 p-4 bg-accent/10 border-accent/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-accent mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-2">OpenRouter API Setup Required</h3>
          <p className="text-xs text-muted-foreground mb-3">
            To use the AI debugging assistant with DeepSeek V3.1, you need to configure your OpenRouter API key.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">OpenRouter API Key</label>
              <Input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Key className="h-3 w-3 mr-1" />
                Save Key
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Get Key
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
            <p className="font-medium mb-1">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>
                Get your API key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  OpenRouter
                </a>
              </li>
              <li>Add OPENROUTER_API_KEY to your environment variables</li>
              <li>DeepSeek V3.1 is available as a free model on OpenRouter</li>
            </ol>
          </div>
        </div>
      </div>
    </Card>
  )
}
