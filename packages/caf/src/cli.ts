#!/usr/bin/env node
import { Command } from "commander"

const program = new Command()

program
  .name("caf")
  .description("Controlled Agent Framework CLI")
  .version("0.0.1")

program
  .command("dev")
  .description("Start development server (SDK + optional GUI)")
  .option("-c, --config <path>", "Agent config file", "./agent.config.ts")
  .option("-p, --port <number>", "HTTP server port", "3000")
  .action(async (options: { config: string; port: string }) => {
    const { startDevServer } = await import("./server/dev")
    await startDevServer({
      configPath: options.config,
      port: parseInt(options.port, 10),
    })
  })

program
  .command("mcp")
  .description("Start MCP server for IDE integration")
  .option("-c, --config <path>", "Agent config file", "./agent.config.ts")
  .action(async (options: { config: string }) => {
    const { MCPServer } = await import("./mcp/server")
    const server = new MCPServer({ configPath: options.config })
    await server.start()
  })

program.parse()
