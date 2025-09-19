"use client"

import { useState } from "react"
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Copy, RotateCcw } from "lucide-react"

interface CodeComparisonProps {
  originalCode: string
  fixedCode: string
  language: string
  explanation: string
  changes: string[]
  issuesFound: string[]
  onApplyFix: (fixedCode: string) => void
  onClose: () => void
}

export function CodeComparison({
  originalCode,
  fixedCode,
  language,
  explanation,
  changes,
  issuesFound,
  onApplyFix,
  onClose,
}: CodeComparisonProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("comparison")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">AI Code Fix Results</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
              <TabsTrigger value="comparison">Code Comparison</TabsTrigger>
              <TabsTrigger value="issues">Issues Found</TabsTrigger>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-4 h-96">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Original Code (With Issues)
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(originalCode)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="350px"
                      language={language}
                      value={originalCode}
                      theme={theme === "dark" ? "vs-dark" : "vs-light"}
                      options={{
                        readOnly: true,
                        fontSize: 12,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Fixed Code
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fixedCode)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="350px"
                      language={language}
                      value={fixedCode}
                      theme={theme === "dark" ? "vs-dark" : "vs-light"}
                      options={{
                        readOnly: true,
                        fontSize: 12,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={() => onApplyFix(fixedCode)} className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Apply Fixed Code
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Keep Original
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="px-4 pb-4">
              <div className="space-y-4">
                <h3 className="font-medium">Issues Found in Your Code:</h3>
                <div className="space-y-2">
                  {issuesFound.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>

                <h3 className="font-medium mt-6">Changes Made:</h3>
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="explanation" className="px-4 pb-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="font-medium mb-4">Detailed Explanation:</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
