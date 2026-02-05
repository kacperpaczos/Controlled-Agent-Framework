import type { ToolDefinition } from "@liberos/caf-shared"

export type ExecutableTool = ToolDefinition & { execute?: (args: Record<string, unknown>) => Promise<unknown> }

export class ToolRegistry {
  private tools = new Map<string, ExecutableTool>()

  register(tool: ExecutableTool): void {
    this.tools.set(tool.id, tool)
  }

  async execute(toolId: string, args: Record<string, unknown>): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const tool = this.tools.get(toolId)
    if (!tool) throw new Error(`Tool not found: ${toolId}`)
    if (!tool.execute) throw new Error(`Tool ${toolId} has no execute function`)

    try {
      const result = await tool.execute(args)
      return { success: true, result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  get(toolId: string): ExecutableTool | undefined {
    return this.tools.get(toolId)
  }

  list(): string[] {
    return Array.from(this.tools.keys())
  }
}
