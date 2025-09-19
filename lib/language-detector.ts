export interface LanguagePattern {
  language: string
  patterns: RegExp[]
  keywords: string[]
  extensions: string[]
}

const languagePatterns: LanguagePattern[] = [
  {
    language: "javascript",
    patterns: [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /=>\s*{/,
      /console\.log/,
      /document\./,
      /window\./,
    ],
    keywords: ["function", "const", "let", "var", "if", "else", "for", "while", "return", "console"],
    extensions: [".js", ".jsx"],
  },
  {
    language: "typescript",
    patterns: [
      /:\s*(string|number|boolean|any|void)/,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /function\s+\w+\s*\([^)]*:\s*\w+/,
      /const\s+\w+:\s*\w+/,
      /export\s+(interface|type)/,
    ],
    keywords: ["interface", "type", "string", "number", "boolean", "any", "void", "export", "import"],
    extensions: [".ts", ".tsx"],
  },
  {
    language: "python",
    patterns: [
      /def\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\s*\(/,
      /if\s+__name__\s*==\s*['"']__main__['"']/,
      /:\s*$/m,
    ],
    keywords: ["def", "class", "import", "from", "if", "elif", "else", "for", "while", "return", "print"],
    extensions: [".py"],
  },
  {
    language: "java",
    patterns: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.print/,
      /public\s+(static\s+)?\w+\s+\w+\s*\(/,
      /private\s+\w+\s+\w+/,
      /import\s+java\./,
    ],
    keywords: ["public", "private", "protected", "class", "static", "void", "int", "String", "System"],
    extensions: [".java"],
  },
  {
    language: "cpp",
    patterns: [
      /#include\s*<[^>]+>/,
      /using\s+namespace\s+std/,
      /int\s+main\s*\(/,
      /cout\s*<<|cin\s*>>/,
      /std::/,
      /#define/,
    ],
    keywords: ["include", "using", "namespace", "std", "int", "main", "cout", "cin", "return"],
    extensions: [".cpp", ".cc", ".cxx"],
  },
  {
    language: "php",
    patterns: [/<\?php/, /\$\w+/, /echo\s+/, /function\s+\w+\s*\(/, /class\s+\w+/, /\?>/],
    keywords: ["echo", "function", "class", "if", "else", "foreach", "while", "return"],
    extensions: [".php"],
  },
]

export function detectLanguage(code: string): string {
  if (!code.trim()) return "javascript" // default

  const scores: { [key: string]: number } = {}

  // Initialize scores
  languagePatterns.forEach((pattern) => {
    scores[pattern.language] = 0
  })

  // Score based on patterns
  languagePatterns.forEach((pattern) => {
    pattern.patterns.forEach((regex) => {
      const matches = code.match(regex)
      if (matches) {
        scores[pattern.language] += matches.length * 2
      }
    })

    // Score based on keywords
    pattern.keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi")
      const matches = code.match(regex)
      if (matches) {
        scores[pattern.language] += matches.length
      }
    })
  })

  // Find language with highest score
  const detectedLanguage = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0]

  return scores[detectedLanguage] > 0 ? detectedLanguage : "javascript"
}

export function getLanguageConfidence(code: string, language: string): number {
  const pattern = languagePatterns.find((p) => p.language === language)
  if (!pattern) return 0

  let score = 0
  let maxScore = 0

  pattern.patterns.forEach((regex) => {
    maxScore += 2
    const matches = code.match(regex)
    if (matches) {
      score += matches.length * 2
    }
  })

  pattern.keywords.forEach((keyword) => {
    maxScore += 1
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    const matches = code.match(regex)
    if (matches) {
      score += matches.length
    }
  })

  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0
}
