# Getting Started with CAF

This guide will walk you through installing CAF, creating your first agent, working with checkpoints, and enabling human-in-the-loop control.

## Installation

Install the core SDK package:

```bash
npm install @liberos/caf
```

For SQLite-backed checkpoints (optional):

```bash
npm install drizzle-orm better-sqlite3
```

## Your First Agent

Create a basic agent that responds to a simple task:

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "my-first-agent",
  instructions: "You are a helpful coding assistant.",
  checkpoints: { enabled: true },
})

const result = await agent.run("Explain TypeScript generics in one sentence.")
console.log(result)
```

**What's happening:**
- `AgentEngine` initializes with a configuration validated by Zod schemas.
- `run(task)` starts execution with the given task string.
- Checkpoints are automatically saved to `./checkpoints/` (by default).

## Working with Checkpoints

CAF's checkpoint system lets you export, restore, and resume agent state.

### Listening to checkpoint events

```typescript
agent.on("agent.checkpoint", (event) => {
  console.log(`Checkpoint created: ${event.checkpoint.id}`)
  console.log(`Step: ${event.checkpoint.metadata.step_number}`)
})

await agent.run("List all Python files in this directory.")
```

### Exporting a checkpoint

```typescript
const checkpointId = "ckpt_123" // from event or logs
const checkpoint = await agent.exportCheckpoint(checkpointId)

// checkpoint is a JSON object matching CheckpointSchema
console.log(checkpoint.snapshot.thought_chain)
```

### Restoring and resuming

```typescript
// Restore the checkpoint as the starting point
await agent.restoreCheckpoint(checkpoint)

// Resume execution from that checkpoint
const result = await agent.run("Continue the task", {
  resumeFrom: checkpoint.id,
})
```

## Human-in-the-Loop

Enable pausing so you can review or modify agent behavior mid-execution.

### Configuration

```typescript
const agent = new AgentEngine({
  name: "hitl-agent",
  instructions: "You analyze codebases and suggest refactorings.",
  pause: {
    manual: true,              // Allow manual pauses
    on_tool_error: true,       // Pause on tool failures
    on_low_confidence: 0.7,   // Pause if confidence < 70%
  },
  checkpoints: { enabled: true },
})
```

### Handling pauses

```typescript
agent.on("agent.paused", async (event) => {
  const { pause_point } = event

  console.log(`Paused: ${pause_point.trigger}`)
  console.log(`Available actions: ${pause_point.available_actions.join(", ")}`)

  // Example: programmatically continue
  // (In a real app, you'd present this to a user via CLI/GUI)
  // await agent.resume(pause_point.id, { action: "continue" })
})

await agent.run("Refactor the authentication module")
```

**Note:** The actual `resume()` API depends on your transport layer (CLI, HTTP server, WebSocket). See [`docs/intervention.md`](intervention.md) for details.

## Using Built-in Tools

CAF includes OpenCode-style tools for filesystem and shell operations.

```typescript
import { AgentEngine } from "@liberos/caf"
import { readFileTool, bashTool } from "@liberos/caf/tools"

const agent = new AgentEngine({
  name: "file-analyzer",
  instructions: "Analyze code structure and report findings.",
  checkpoints: { enabled: true },
})

// Tools are registered by default; you can also add custom tools:
// agent.toolRegistry.register(myCustomTool)

await agent.run("Read package.json and list all dependencies")
```

Available built-in tools:
- `read_file` – read file contents
- `write_file` – write or overwrite a file
- `edit_file` – apply regex replacements
- `bash` – execute shell commands
- `glob` – find files matching a pattern
- `grep` – search file contents

## Running with Sentinel GUI (Optional)

Sentinel is a Next.js-based GUI for visualizing agent execution in real-time.

### Start the dev server

```bash
# Terminal 1: Run your agent with the dev HTTP server
npx caf dev --config ./my-agent.config.ts
```

### Start Sentinel

```bash
# Terminal 2: Launch the GUI
cd packages/sentinel
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view:
- Execution monitor (live events)
- Thought chain visualization (React Flow graph)
- Checkpoint browser
- Intervention panel (pause/resume)

**Important:** The GUI is optional. Agents work standalone via the programmatic API or MCP server.

## Using MCP Server for IDE Integration

Expose your agent to IDEs like Cursor or VSCode via the Model Context Protocol.

```bash
npx caf mcp --config ./agent.config.ts
```

This starts a JSON-RPC server over STDIN/STDOUT. Configure your IDE to connect to it for agent-powered features (code analysis, refactoring suggestions, etc.).

## Next Steps

- **[API Reference](api-reference.md)** – Complete method and event documentation
- **[Checkpoint System](checkpoint-system.md)** – Deep dive into 3-layer data architecture
- **[Human-in-the-Loop](intervention.md)** – Advanced pause/resume patterns
- **[Architecture](architecture/)** – Design philosophy and implementation details
- **[Examples](../examples/)** – Sample projects demonstrating multi-step workflows

## Configuration Schema

All configuration objects are validated with Zod. Key fields:

```typescript
interface AgentConfig {
  name: string                     // Agent identifier
  instructions: string             // System prompt
  checkpoints?: {
    enabled: boolean
    export_dir?: string            // Default: "./checkpoints"
  }
  pause?: {
    manual?: boolean
    on_tool_error?: boolean
    on_low_confidence?: number     // Threshold (0.0-1.0)
  }
  // ... other fields (see AgentConfigSchema in @liberos/caf-shared)
}
```

For full schema details, see [`packages/shared/src/schemas/agent.ts`](../packages/shared/src/schemas/agent.ts).
