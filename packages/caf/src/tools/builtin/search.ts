import type { ToolDefinition } from "@liberos/caf-shared"
import * as fs from "fs"
import * as path from "path"

function globSync(pattern: string, cwd: string): string[] {
  const results: string[] = []
  const parts = pattern.split("/")
  function walk(dir: string, partIndex: number) {
    if (partIndex >= parts.length) {
      results.push(path.relative(cwd, dir))
      return
    }
    const part = parts[partIndex]
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    if (part === "**") {
      walk(dir, partIndex + 1)
      for (const e of entries) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full, partIndex)
        else if (e.isFile()) walk(full, partIndex + 1)
      }
      return
    }
    const isGlob = part.includes("*")
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory() && (isGlob || part === e.name || part === "**")) {
        walk(full, partIndex + 1)
      } else if (e.isFile() && matchPart(part, e.name)) {
        walk(full, partIndex + 1)
      }
    }
  }
  function matchPart(p: string, name: string): boolean {
    if (p === "*") return true
    if (!p.includes("*")) return p === name
    const re = new RegExp("^" + p.replace(/\*/g, ".*") + "$")
    return re.test(name)
  }
  walk(cwd, 0)
  return results
}

const globTool: ToolDefinition & { execute: (args: { pattern: string; cwd?: string }) => Promise<string[]> } = {
  id: "glob",
  name: "glob",
  description: "Find files matching a glob pattern",
  category: "filesystem",
  parameters: [
    { name: "pattern", type: "string", required: true, description: "Glob pattern (e.g. **/*.ts)" },
    { name: "cwd", type: "string", required: false, description: "Working directory" },
  ],
  return_type: { type: "array" },
  permissions: ["fs:read"],
  async execute(args) {
    const cwd = args.cwd ?? process.cwd()
    return globSync(args.pattern, cwd)
  },
}

function grepFile(filePath: string, pattern: string | RegExp): { path: string; line_number: number; line: string }[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const re = typeof pattern === "string" ? new RegExp(pattern) : pattern
  const out: { path: string; line_number: number; line: string }[] = []
  lines.forEach((line: string, i: number) => {
    if (re.test(line)) out.push({ path: filePath, line_number: i + 1, line })
  })
  return out
}

const grepTool: ToolDefinition & {
  execute: (args: { pattern: string; path: string; recursive?: boolean }) => Promise<{ path: string; line_number: number; line: string }[]>
} = {
  id: "grep",
  name: "grep",
  description: "Search for pattern in files",
  category: "filesystem",
  parameters: [
    { name: "pattern", type: "string", required: true, description: "Regex pattern" },
    { name: "path", type: "string", required: true, description: "File or directory" },
    { name: "recursive", type: "boolean", required: false, description: "Search in subdirectories" },
  ],
  return_type: { type: "array" },
  permissions: ["fs:read"],
  async execute(args) {
    const stat = fs.statSync(args.path)
    if (stat.isFile()) {
      return grepFile(args.path, args.pattern)
    }
    const results: { path: string; line_number: number; line: string }[] = []
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isFile()) results.push(...grepFile(full, args.pattern))
        else if (e.isDirectory() && args.recursive) walk(full)
      }
    }
    walk(args.path)
    return results
  },
}

export const builtinSearchTools = [globTool, grepTool]
