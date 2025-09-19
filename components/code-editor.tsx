"use client"

import { useRef, useEffect } from "react"
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { createErrorDetector } from "@/lib/error-detectors"
import type { CodeError } from "./code-debugger"

interface CodeEditorProps {
  code: string
  language: string
  onChange: (value: string) => void
  onErrorsChange: (errors: CodeError[]) => void
}

export function CodeEditor({ code, language, onChange, onErrorsChange }: CodeEditorProps) {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const errorDetectorRef = useRef(createErrorDetector(language))

  useEffect(() => {
    errorDetectorRef.current = createErrorDetector(language)
  }, [language])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
    })

    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      if (model) {
        const value = model.getValue()
        const errors = errorDetectorRef.current.detectErrors(value)

        // Convert errors to Monaco markers
        const markers = errors.map((error) => ({
          startLineNumber: error.line,
          startColumn: error.column,
          endLineNumber: error.line,
          endColumn: error.column + 10,
          message: error.message,
          severity:
            error.type === "error"
              ? monaco.MarkerSeverity.Error
              : error.type === "warning"
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Info,
        }))

        monaco.editor.setModelMarkers(model, "owner", markers)
        onErrorsChange(errors)
      }
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || ""
    onChange(newValue)

    const errors = errorDetectorRef.current.detectErrors(newValue)
    onErrorsChange(errors)
  }

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case "javascript":
        return `// Welcome to Code Debugger!
// Try typing some JavaScript code below

function greet(name) {
    console.log("Hello, " + name + "!")
}

greet("World")`
      case "python":
        return `# Welcome to Code Debugger!
# Try typing some Python code below

def greet(name):
    print(f"Hello, {name}!")

greet("World")`
      case "cpp":
        return `// Welcome to Code Debugger!
// Try typing some C++ code below

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
      case "java":
        return `// Welcome to Code Debugger!
// Try typing some Java code below

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
      case "php":
        return `<?php
// Welcome to Code Debugger!
// Try typing some PHP code below

function greet($name) {
    echo "Hello, " . $name . "!";
}

greet("World");
?>`
      case "typescript":
        return `// Welcome to Code Debugger!
// Try typing some TypeScript code below

function greet(name: string): void {
    console.log(\`Hello, \${name}!\`);
}

greet("World");`
      default:
        return "// Start coding here..."
    }
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={code || getDefaultCode(language)}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === "dark" ? "vs-dark" : "vs-light"}
        options={{
          fontSize: 14,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  )
}
