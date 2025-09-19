import type { CodeError } from "@/components/code-debugger"

export interface ErrorDetector {
  detectErrors(code: string): CodeError[]
}

export class JavaScriptErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Missing semicolon detection
      if (this.shouldHaveSemicolon(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          type: "warning",
          severity: "low",
          suggestion: "Add a semicolon at the end of the statement",
        })
      }

      // Undefined variable detection (basic)
      const undefinedVarMatch = trimmedLine.match(/(\w+)\s*=/)
      if (
        undefinedVarMatch &&
        !trimmedLine.includes("var") &&
        !trimmedLine.includes("let") &&
        !trimmedLine.includes("const")
      ) {
        if (!this.isKnownGlobal(undefinedVarMatch[1])) {
          errors.push({
            line: lineNumber,
            column: line.indexOf(undefinedVarMatch[1]),
            message: `Variable '${undefinedVarMatch[1]}' is not declared`,
            type: "error",
            severity: "high",
            suggestion: "Declare the variable with 'let', 'const', or 'var'",
          })
        }
      }

      // Missing opening brace
      if (trimmedLine.includes("function") && !trimmedLine.includes("{") && !trimmedLine.endsWith(";")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("function"),
          message: "Missing opening brace for function",
          type: "error",
          severity: "high",
          suggestion: "Add an opening brace '{' after the function declaration",
        })
      }

      // Unclosed parentheses
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length
      if (openParens > closeParens) {
        errors.push({
          line: lineNumber,
          column: line.lastIndexOf("("),
          message: "Unclosed parenthesis",
          type: "error",
          severity: "high",
          suggestion: "Add a closing parenthesis ')' to match the opening one",
        })
      }

      // Comparison assignment warning
      if (
        trimmedLine.includes("=") &&
        !trimmedLine.includes("==") &&
        !trimmedLine.includes("!=") &&
        trimmedLine.includes("if")
      ) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("="),
          message: "Assignment in conditional statement",
          type: "warning",
          severity: "medium",
          suggestion: "Did you mean to use '==' for comparison instead of '=' for assignment?",
        })
      }
    })

    return errors
  }

  private shouldHaveSemicolon(line: string): boolean {
    if (!line || line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return false
    return /^(console\.|return |var |let |const |.*$$$$)/.test(line) && !line.includes("//")
  }

  private isKnownGlobal(variable: string): boolean {
    const globals = ["console", "window", "document", "process", "global", "require", "module", "exports"]
    return globals.includes(variable)
  }
}

export class PythonErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Print statement without parentheses (Python 3)
      if (trimmedLine.includes("print ") && !trimmedLine.includes("print(")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("print"),
          message: "Print statement requires parentheses in Python 3",
          type: "error",
          severity: "high",
          suggestion: "Use print() with parentheses: print('your message')",
        })
      }

      // Indentation errors (basic detection)
      if (trimmedLine && line.startsWith(" ") && !line.startsWith("    ")) {
        const spaces = line.match(/^ */)?.[0].length || 0
        if (spaces % 4 !== 0) {
          errors.push({
            line: lineNumber,
            column: 0,
            message: "Inconsistent indentation",
            type: "error",
            severity: "high",
            suggestion: "Use 4 spaces for each indentation level",
          })
        }
      }

      // Missing colon after control structures
      if (/^(if|for|while|def|class|try|except|finally|with)\s+.*[^:]$/.test(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing colon after control structure",
          type: "error",
          severity: "high",
          suggestion: "Add a colon ':' at the end of the line",
        })
      }

      // Undefined variable (basic detection)
      const varMatch = trimmedLine.match(/^(\w+)\s*=/)
      if (varMatch && this.isPotentiallyUndefined(varMatch[1], lines.slice(0, index))) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(varMatch[1]),
          message: `Variable '${varMatch[1]}' may be undefined`,
          type: "warning",
          severity: "medium",
          suggestion: "Make sure the variable is defined before use",
        })
      }
    })

    return errors
  }

  private isPotentiallyUndefined(variable: string, previousLines: string[]): boolean {
    const builtins = ["print", "len", "str", "int", "float", "list", "dict", "set", "tuple"]
    if (builtins.includes(variable)) return false

    return !previousLines.some((line) => line.includes(`${variable} =`) || line.includes(`def ${variable}`))
  }
}

export class CppErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Missing semicolon
      if (this.shouldHaveSemicolon(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          type: "error",
          severity: "high",
          suggestion: "Add a semicolon ';' at the end of the statement",
        })
      }

      // Missing include guards
      if (trimmedLine.includes("#include") && !code.includes("#ifndef") && lineNumber === 1) {
        errors.push({
          line: lineNumber,
          column: 0,
          message: "Consider using include guards",
          type: "info",
          severity: "low",
          suggestion: "Add include guards to prevent multiple inclusions",
        })
      }

      // Unmatched braces (basic detection)
      const openBraces = (line.match(/\{/g) || []).length
      const closeBraces = (line.match(/\}/g) || []).length
      if (openBraces > closeBraces && !trimmedLine.endsWith("{")) {
        errors.push({
          line: lineNumber,
          column: line.lastIndexOf("{"),
          message: "Unmatched opening brace",
          type: "error",
          severity: "high",
          suggestion: "Add a closing brace '}' to match the opening one",
        })
      }

      // Missing return type
      if (trimmedLine.includes("main(") && !trimmedLine.includes("int main")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("main"),
          message: "Main function should return int",
          type: "warning",
          severity: "medium",
          suggestion: "Change to 'int main()' and add 'return 0;' at the end",
        })
      }
    })

    return errors
  }

  private shouldHaveSemicolon(line: string): boolean {
    if (!line || line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return false
    if (line.includes("#include") || line.includes("#define") || line.includes("//")) return false
    return /^(cout|cin|return |.*$$$$|.*=)/.test(line)
  }
}

export class JavaErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Missing semicolon
      if (this.shouldHaveSemicolon(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          type: "error",
          severity: "high",
          suggestion: "Add a semicolon ';' at the end of the statement",
        })
      }

      // Class naming convention
      const classMatch = trimmedLine.match(/class\s+(\w+)/)
      if (classMatch && !this.isCapitalized(classMatch[1])) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(classMatch[1]),
          message: "Class names should start with uppercase letter",
          type: "warning",
          severity: "low",
          suggestion: `Rename '${classMatch[1]}' to '${this.capitalize(classMatch[1])}'`,
        })
      }

      // Missing main method signature
      if (trimmedLine.includes("main(") && !trimmedLine.includes("public static void main")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("main"),
          message: "Main method should be 'public static void main(String[] args)'",
          type: "error",
          severity: "high",
          suggestion: "Use the correct main method signature",
        })
      }

      // Unmatched braces
      const openBraces = (line.match(/\{/g) || []).length
      const closeBraces = (line.match(/\}/g) || []).length
      if (openBraces > closeBraces && !trimmedLine.endsWith("{")) {
        errors.push({
          line: lineNumber,
          column: line.lastIndexOf("{"),
          message: "Unmatched opening brace",
          type: "error",
          severity: "high",
          suggestion: "Add a closing brace '}' to match the opening one",
        })
      }
    })

    return errors
  }

  private shouldHaveSemicolon(line: string): boolean {
    if (!line || line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return false
    if (line.includes("//") || line.includes("/*") || line.includes("*/")) return false
    return /^(System\.|return |.*$$$$|.*=|.*\+\+|.*--)/.test(line)
  }

  private isCapitalized(str: string): boolean {
    return str.charAt(0) === str.charAt(0).toUpperCase()
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

export class PhpErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Missing PHP opening tag
      if (lineNumber === 1 && !trimmedLine.includes("<?php") && trimmedLine.length > 0) {
        errors.push({
          line: lineNumber,
          column: 0,
          message: "PHP code should start with <?php tag",
          type: "error",
          severity: "high",
          suggestion: "Add '<?php' at the beginning of your PHP file",
        })
      }

      // Missing semicolon
      if (this.shouldHaveSemicolon(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          type: "error",
          severity: "high",
          suggestion: "Add a semicolon ';' at the end of the statement",
        })
      }

      // Variable without $ prefix
      const varMatch = trimmedLine.match(/(\w+)\s*=/)
      if (varMatch && !varMatch[1].startsWith("$") && !this.isPhpKeyword(varMatch[1])) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(varMatch[1]),
          message: `PHP variables must start with $`,
          type: "error",
          severity: "high",
          suggestion: `Change '${varMatch[1]}' to '$${varMatch[1]}'`,
        })
      }

      // Echo without quotes for strings
      if (
        trimmedLine.includes("echo ") &&
        !trimmedLine.includes('"') &&
        !trimmedLine.includes("'") &&
        !trimmedLine.includes("$")
      ) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("echo"),
          message: "String literals should be quoted",
          type: "warning",
          severity: "medium",
          suggestion: "Wrap string literals in quotes",
        })
      }
    })

    return errors
  }

  private shouldHaveSemicolon(line: string): boolean {
    if (!line || line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return false
    if (line.includes("//") || line.includes("/*") || line.includes("<?php") || line.includes("?>")) return false
    return /^(echo |return |\$.*=|.*$$$$)/.test(line)
  }

  private isPhpKeyword(word: string): boolean {
    const keywords = ["function", "class", "if", "else", "while", "for", "foreach", "echo", "print", "return"]
    return keywords.includes(word)
  }
}

export class TypeScriptErrorDetector implements ErrorDetector {
  detectErrors(code: string): CodeError[] {
    const errors: CodeError[] = []
    const lines = code.split("\n")

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Missing type annotations
      const functionMatch = trimmedLine.match(/function\s+(\w+)\s*$$[^)]*$$\s*{/)
      if (functionMatch && !trimmedLine.includes(":")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(functionMatch[1]),
          message: "Function missing return type annotation",
          type: "warning",
          severity: "medium",
          suggestion: "Add a return type annotation like ': void' or ': string'",
        })
      }

      // Parameter without type
      const paramMatch = trimmedLine.match(/function\s+\w+\s*$$([^)]+)$$/)
      if (paramMatch && !paramMatch[1].includes(":")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf("("),
          message: "Parameter missing type annotation",
          type: "warning",
          severity: "medium",
          suggestion: "Add type annotations to function parameters",
        })
      }

      // Missing semicolon (same as JavaScript)
      if (this.shouldHaveSemicolon(trimmedLine)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          type: "warning",
          severity: "low",
          suggestion: "Add a semicolon at the end of the statement",
        })
      }

      // Any type usage
      if (trimmedLine.includes(": any")) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(": any"),
          message: "Avoid using 'any' type",
          type: "warning",
          severity: "medium",
          suggestion: "Use specific types instead of 'any' for better type safety",
        })
      }
    })

    return errors
  }

  private shouldHaveSemicolon(line: string): boolean {
    if (!line || line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return false
    return /^(console\.|return |var |let |const |.*$$$$)/.test(line) && !line.includes("//")
  }
}

export function createErrorDetector(language: string): ErrorDetector {
  switch (language) {
    case "javascript":
      return new JavaScriptErrorDetector()
    case "python":
      return new PythonErrorDetector()
    case "cpp":
      return new CppErrorDetector()
    case "java":
      return new JavaErrorDetector()
    case "php":
      return new PhpErrorDetector()
    case "typescript":
      return new TypeScriptErrorDetector()
    default:
      return new JavaScriptErrorDetector() // fallback
  }
}
