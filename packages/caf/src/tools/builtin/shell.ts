import type { ToolDefinition } from "@liberos/caf-shared"
import { execSync } from "child_process"

const bashTool: ToolDefinition & { execute: (args: { command: string; cwd?: string }) => Promise<{ stdout: string; stderr: string; exitCode: number }> } = {
  id: "bash",
  name: "bash",
  description: "Execute a shell command",
  category: "shell",
  parameters: [
    { name: "command", type: "string", required: true, description: "Shell command to run" },
    { name: "cwd", type: "string", required: false, description: "Working directory" },
  ],
  return_type: { type: "object" },
  permissions: ["shell"],
  async execute(args) {
    try {
      const stdout = execSync(args.command, {
        encoding: "utf-8",
        cwd: args.cwd,
      })
      return { stdout, stderr: "", exitCode: 0 }
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; status?: number }
      return {
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? String(e),
        exitCode: e.status ?? 1,
      }
    }
  },
}

export const builtinShellTools = [bashTool]
