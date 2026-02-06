# CAF – Controlled Agent Framework

**SDK-first library for building AI agents with advanced observability and human-in-the-loop control.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

CAF (Controlled Agent Framework) is a TypeScript framework designed for developers who need full visibility and control over their AI agents. Unlike black-box solutions, CAF provides:

- **Complete observability** – every thought, decision, and tool call is trackable
- **Human-in-the-loop** – pause execution at any point for review or modification
- **Checkpoint system** – export/import agent state as portable JSON files
- **Reasoning traces** – understand why decisions were made, with alternatives considered
- **Event-driven architecture** – integrate with any monitoring or UI system

## Philosophy: SDK First

The library is the primary product. The GUI (Sentinel) is an optional development tool that connects to a running agent via WebSocket – **not required for production use**.

## Core Capabilities

### 1. Agent Execution Engine

Built on [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) with native support for checkpoints and interrupts:

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "my-agent",
  instructions: "You are a code analysis assistant.",
  checkpoints: { enabled: true },
  pause: { on_low_confidence: 0.7 }
})

const result = await agent.run("Analyze this codebase")
```

### 2. Three-Layer Data Architecture

- **Runtime**: Separated objects (`ThoughtChain`, `Context`, `ToolState`) for fast updates
- **Export**: Monolithic JSON files for portability and git-friendly diffs
- **Database**: Normalized SQLite tables (via Drizzle ORM) for querying and analytics

### 3. Built-in Tools

OpenCode-style tools ready out of the box:

- `read_file`, `write_file`, `edit_file` – filesystem operations
- `bash` – shell command execution
- `glob`, `grep` – file search and content search

### 4. Type-Safe Event System

All data structures are Zod schemas with discriminated unions:

```typescript
agent.on("agent.checkpoint", (e) => {
  console.log(`Step ${e.checkpoint.metadata.step_number}`)
})

agent.on("agent.paused", async (e) => {
  const { pause_point } = e
  // Review available_actions, resume/modify/cancel
})
```

### 5. MCP Server Integration

Expose agents to IDEs (Cursor, VSCode) via Model Context Protocol:

```bash
npx caf mcp --config ./agent.config.ts
```

## Packages

| Package | Description |
|---------|-------------|
| **[@liberos/caf](packages/caf/)** | Core SDK – agent engine, checkpoints, tools, events, MCP |
| **[@liberos/caf-shared](packages/shared/)** | Shared Zod schemas and TypeScript types |
| **[@liberos/sentinel](packages/sentinel/)** | Optional Next.js GUI for visualization |

## Quick Start

### Installation

```bash
npm install @liberos/caf
# Optional: SQLite support
npm install drizzle-orm better-sqlite3
```

### Basic Example

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "assistant",
  instructions: "You help with coding tasks.",
  checkpoints: { enabled: true, export_dir: "./checkpoints" }
})

// Listen to events
agent.on("checkpoint", (e) => {
  console.log(`Checkpoint: ${e.checkpoint.id}`)
})

// Run agent
const result = await agent.run("List all TypeScript files")

// Export/restore checkpoints
const checkpoint = await agent.exportCheckpoint(checkpointId)
await agent.restoreCheckpoint(checkpoint)
```

### With GUI (Optional)

```bash
# Terminal 1: Run agent with dev server
npx caf dev --config ./agent.config.ts

# Terminal 2: Start Sentinel GUI
cd packages/sentinel && npm run dev
# Open http://localhost:3001
```

## Use Cases

- **Code analysis agents** – understand codebases with full execution traces
- **Automated refactoring** – human review before applying changes
- **Research assistants** – track reasoning paths and alternatives
- **Long-running workflows** – checkpoint state, resume after interruptions
- **Multi-agent systems** – observable communication and coordination

## Documentation

- **[Getting Started](docs/getting-started.md)** – Installation, first agent, checkpoints
- **[API Reference](docs/api-reference.md)** – Complete SDK API documentation
- **[Checkpoint System](docs/checkpoint-system.md)** – 3-layer data architecture
- **[Human-in-the-Loop](docs/intervention.md)** – Pause/resume, intervention API
- **[Architecture](docs/architecture/)** – Design decisions and data flows

## Development

```bash
# Clone repository
git clone https://github.com/kacperpaczos/Controlled-Agent-Framework.git
cd Controlled-Agent-Framework

# Install dependencies
npm install

# Build all packages
npm run build

# Run example
cd examples/basic-agent && npm install && npm start
```

## Version

Current schema version: **`0.0.1`**

All field names use `snake_case`. Structures are defined with Zod for runtime validation and type safety.

## License

[MIT](LICENSE)

## Contributing

See individual package READMEs for development setup. Architecture documentation is in [`docs/architecture/`](docs/architecture/).
