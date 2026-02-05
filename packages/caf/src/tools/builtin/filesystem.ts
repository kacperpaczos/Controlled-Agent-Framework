import type { ToolDefinition } from "@liberos/caf-shared"
import * as fs from "fs"
import * as path from "path"

const readFileTool: ToolDefinition & { execute: (args: { path: string; offset?: number; limit?: number }) => Promise<string> } = {
  id: "read_file",
  name: "read_file",
  description: "Read contents of a file from filesystem",
  category: "filesystem",
  parameters: [
    { name: "path", type: "string", required: true, description: "Absolute or relative path to file" },
    { name: "offset", type: "number", required: false, description: "Line number to start reading from" },
    { name: "limit", type: "number", required: false, description: "Number of lines to read" },
  ],
  return_type: { type: "string" },
  permissions: ["fs:read"],
  async execute(args) {
    const content = fs.readFileSync(args.path, "utf-8")
    if (args.offset != null || args.limit != null) {
      const lines = content.split("\n")
      const start = args.offset ?? 0
      const end = args.limit != null ? start + args.limit : lines.length
      return lines.slice(start, end).join("\n")
    }
    return content
  },
}

const writeFileTool: ToolDefinition & { execute: (args: { path: string; content: string }) => Promise<void> } = {
  id: "write_file",
  name: "write_file",
  description: "Write content to a file",
  category: "filesystem",
  parameters: [
    { name: "path", type: "string", required: true, description: "Path to file" },
    { name: "content", type: "string", required: true, description: "Content to write" },
  ],
  return_type: { type: "void" },
  permissions: ["fs:write"],
  async execute(args) {
    fs.mkdirSync(path.dirname(args.path), { recursive: true })
    fs.writeFileSync(args.path, args.content, "utf-8")
  },
}

function editFileToolImpl(args: { path: string; old_string: string; new_string: string }): string {
  const content = fs.readFileSync(args.path, "utf-8")
  if (!content.includes(args.old_string)) {
    throw new Error("old_string not found in file")
  }
  const newContent = content.replace(args.old_string, args.new_string)
  fs.writeFileSync(args.path, newContent, "utf-8")
  return newContent
}

const editFileTool: ToolDefinition & { execute: (args: { path: string; old_string: string; new_string: string }) => Promise<string> } = {
  id: "edit_file",
  name: "edit_file",
  description: "Replace old_string with new_string in a file",
  category: "filesystem",
  parameters: [
    { name: "path", type: "string", required: true, description: "Path to file" },
    { name: "old_string", type: "string", required: true, description: "Exact string to replace" },
    { name: "new_string", type: "string", required: true, description: "Replacement string" },
  ],
  return_type: { type: "string" },
  permissions: ["fs:read", "fs:write"],
  async execute(args) {
    return editFileToolImpl(args)
  },
}

export const builtinFilesystemTools = [readFileTool, writeFileTool, editFileTool]
