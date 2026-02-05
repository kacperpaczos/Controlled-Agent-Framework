import type { AgentEngine } from "../agent/engine"

export interface MCPServerOptions {
  configPath?: string
  agent?: AgentEngine
}

export class MCPServer {
  private agent: AgentEngine | null = null
  private configPath?: string

  constructor(options: MCPServerOptions = {}) {
    this.agent = options.agent ?? null
    this.configPath = options.configPath
  }

  setAgent(agent: AgentEngine): void {
    this.agent = agent
  }

  async start(): Promise<void> {
    if (!this.agent && this.configPath) {
      try {
        const mod = await import(this.configPath)
        const config = mod.default ?? mod.config
        if (config) {
          const { AgentEngine } = await import("../agent/engine")
          this.agent = new AgentEngine(config)
        }
      } catch (err) {
        console.error("Failed to load agent config:", err)
      }
    }

    const readline = await import("readline")
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    rl.on("line", async (line: string) => {
      try {
        const request = JSON.parse(line) as {
          jsonrpc: string
          id?: string
          method: string
          params?: { name?: string; arguments?: Record<string, unknown> }
        }
        const response = await this.handleRequest(request)
        process.stdout.write(JSON.stringify(response) + "\n")
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: undefined,
            error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
          }) + "\n"
        )
      }
    })
  }

  private async handleRequest(request: {
    jsonrpc: string
    id?: string
    method: string
    params?: { name?: string; arguments?: Record<string, unknown> }
  }): Promise<unknown> {
    const id = request.id
    const method = request.method

    if (method === "tools/list") {
      if (!this.agent) return { jsonrpc: "2.0", id, result: { tools: [] } }
      const registry = (this.agent as unknown as { toolRegistry: { list: () => string[] } }).toolRegistry
      const list = registry.list()
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: list.map((name) => ({ name, description: name, inputSchema: {} })),
        },
      }
    }

    if (method === "tools/call") {
      const params = request.params
      const name = params?.name
      const args = params?.arguments ?? {}
      if (!this.agent || !name) {
        return { jsonrpc: "2.0", id, error: { code: -32602, message: "Missing agent or tool name" } }
      }
      const result = await this.agent.run(typeof args.task === "string" ? args.task : JSON.stringify(args))
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result) }] },
      }
    }

    if (method === "resources/list") {
      return { jsonrpc: "2.0", id, result: { resources: [] } }
    }

    if (method === "resources/read") {
      return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }
    }

    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } }
  }
}
