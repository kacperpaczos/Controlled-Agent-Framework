# API Reference

Complete API documentation for `@liberos/caf` core classes and methods.

## AgentEngine

The main class for creating and managing AI agents.

### Constructor

```typescript
constructor(config: AgentConfig)
```

Creates a new agent instance. Configuration is validated against `AgentConfigSchema` from `@liberos/caf-shared`.

**Parameters:**
- `config: AgentConfig` – Agent configuration object

**Example:**

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "my-agent",
  instructions: "You are a code analysis assistant.",
  checkpoints: { enabled: true, export_dir: "./checkpoints" },
  pause: { on_tool_error: true, on_low_confidence: 0.6 },
})
```

### run()

```typescript
run(task: string, options?: RunOptions): Promise<unknown>
```

Starts agent execution with the given task.

**Parameters:**
- `task: string` – The task description or prompt
- `options?: RunOptions` – Optional execution configuration
  - `resumeFrom?: string` – Checkpoint ID to resume from
  - `onCheckpoint?: (checkpoint: Checkpoint) => void` – Callback for each checkpoint
  - `onPause?: (pausePoint: PausePoint) => void` – Callback when agent pauses

**Returns:** `Promise<unknown>` – Agent's final output

**Example:**

```typescript
const result = await agent.run("Analyze this codebase", {
  resumeFrom: "ckpt_abc123",
  onCheckpoint: (cp) => console.log(`Step ${cp.metadata.step_number}`),
})
```

### on()

```typescript
on(eventType: string, listener: (event: AgentEvent) => void): this
```

Registers an event listener for agent events.

**Event types:**
- `agent.started` – Execution began
- `agent.checkpoint` – New checkpoint created
- `agent.paused` – Execution paused (HITL)
- `agent.resumed` – Execution resumed after pause
- `agent.completed` – Execution finished
- `thought.created` – New thought added to chain
- `tool.called` – Tool invocation started
- `tool.completed` – Tool invocation finished
- `error.occurred` – Error during execution

**Example:**

```typescript
agent.on("agent.checkpoint", (event) => {
  console.log(`Checkpoint: ${event.checkpoint.id}`)
})

agent.on("agent.paused", async (event) => {
  const { pause_point } = event
  // Handle pause, prompt user, etc.
})
```

### exportCheckpoint()

```typescript
exportCheckpoint(checkpointId: string): Promise<Checkpoint>
```

Exports a checkpoint by ID from file storage or database.

**Parameters:**
- `checkpointId: string` – ID of the checkpoint to export

**Returns:** `Promise<Checkpoint>` – Full checkpoint object (JSON)

**Example:**

```typescript
const checkpoint = await agent.exportCheckpoint("ckpt_xyz")
console.log(checkpoint.snapshot.thought_chain)
```

### restoreCheckpoint()

```typescript
restoreCheckpoint(checkpoint: Checkpoint): Promise<void>
```

Restores a checkpoint as the starting state for the next `run()` call.

**Note:** To actually resume execution, call `run()` with `resumeFrom: checkpoint.id`.

**Parameters:**
- `checkpoint: Checkpoint` – Checkpoint object to restore

**Example:**

```typescript
await agent.restoreCheckpoint(checkpoint)
const result = await agent.run("Continue task", { resumeFrom: checkpoint.id })
```

### setDatabase()

```typescript
setDatabase(db: unknown): void
```

Sets a Drizzle ORM database instance for checkpoint persistence.

**Parameters:**
- `db: unknown` – Drizzle database instance (e.g., from `drizzle(new Database())`)

**Example:**

```typescript
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"

const sqlite = new Database("./data/checkpoints.db")
const db = drizzle(sqlite)

agent.setDatabase(db)
```

---

## ToolRegistry

Manages tool registration and execution.

### register()

```typescript
register(tool: ToolDefinition): void
```

Registers a tool for use by the agent.

**Parameters:**
- `tool: ToolDefinition` – Tool definition with `id`, `description`, `parameters`, and `execute` method

**Example:**

```typescript
import { ToolRegistry } from "@liberos/caf"

const registry = new ToolRegistry()

registry.register({
  id: "calculator",
  description: "Performs arithmetic operations",
  parameters: { /* Zod schema */ },
  execute: async (args) => {
    return { success: true, result: args.a + args.b }
  },
})
```

### execute()

```typescript
execute(toolId: string, args: Record<string, unknown>): Promise<ToolResult>
```

Executes a registered tool with the given arguments.

**Parameters:**
- `toolId: string` – ID of the tool to execute
- `args: Record<string, unknown>` – Arguments object matching tool's parameter schema

**Returns:** `Promise<ToolResult>` – Object with `{ success: boolean, result?: unknown, error?: string }`

**Example:**

```typescript
const result = await registry.execute("calculator", { a: 5, b: 3 })
console.log(result.result) // 8
```

---

## PromptCompiler

Compiles dynamic prompts with template variables and hooks.

### compile()

```typescript
compile(template: string, context: Context): string
```

Replaces `{{variable}}` placeholders in the template with values from `context.variables` and applies registered hooks.

**Parameters:**
- `template: string` – Prompt template with `{{placeholders}}`
- `context: Context` – Context object containing variables

**Returns:** `string` – Compiled prompt

**Example:**

```typescript
import { PromptCompiler } from "@liberos/caf"

const compiler = new PromptCompiler()

const template = "Hello {{name}}, your task is: {{task}}"
const context = { variables: { name: "Alice", task: "code review" } }

const prompt = compiler.compile(template, context)
// "Hello Alice, your task is: code review"
```

### registerHook()

```typescript
registerHook(hook: PromptHook): void
```

Registers a transformation hook that modifies compiled prompts.

**Parameters:**
- `hook: PromptHook` – Hook function with signature `(prompt: string, context: Context) => string`

**Example:**

```typescript
compiler.registerHook((prompt, context) => {
  // Add timestamp to all prompts
  return `[${new Date().toISOString()}] ${prompt}`
})
```

---

## CheckpointManager

Handles hybrid checkpoint storage (files + optional database).

### save()

```typescript
save(checkpoint: Checkpoint): Promise<void>
```

Saves a checkpoint to disk (as JSON) and optionally to the database.

**Parameters:**
- `checkpoint: Checkpoint` – Checkpoint object to save

### restore()

```typescript
restore(checkpointId: string): Promise<Checkpoint>
```

Restores a checkpoint from disk or database.

**Parameters:**
- `checkpointId: string` – ID of checkpoint to restore

**Returns:** `Promise<Checkpoint>`

---

## Event System

All events conform to `AgentEvent` discriminated union. Use `.type` to narrow the event type in TypeScript.

### Event Structure

```typescript
type AgentEvent =
  | { type: "agent.started"; execution_id: string; timestamp: number; ... }
  | { type: "agent.checkpoint"; checkpoint: Checkpoint; ... }
  | { type: "agent.paused"; pause_point: PausePoint; ... }
  | { type: "agent.completed"; result: unknown; ... }
  | { type: "thought.created"; thought: ThoughtStep; ... }
  | { type: "tool.called"; tool_call: ToolCall; ... }
  | { type: "error.occurred"; error: string; ... }
```

All events include:
- `type` – Event discriminator
- `timestamp` – Unix timestamp (milliseconds)
- `execution_id` – ID of the current execution

### Type-Safe Handling

```typescript
agent.on("event", (e) => {
  switch (e.type) {
    case "agent.checkpoint":
      console.log(`Step: ${e.checkpoint.metadata.step_number}`)
      break
    case "agent.paused":
      console.log(`Paused: ${e.pause_point.trigger}`)
      break
  }
})
```

---

## Data Schemas

All data structures are defined as Zod schemas in `@liberos/caf-shared`. Import types or schemas as needed:

```typescript
import type { Checkpoint, ThoughtChain, Context, ToolState } from "@liberos/caf-shared"
import { CheckpointSchema, AgentConfigSchema } from "@liberos/caf-shared"

// Validate data at runtime
const validatedConfig = AgentConfigSchema.parse(userConfig)
```

**Key schemas:**
- `AgentConfigSchema` – Agent configuration
- `CheckpointSchema` – Full checkpoint structure
- `ThoughtStepSchema` – Individual thought in the chain
- `ContextSchema` – Agent context (variables, state)
- `ToolCallSchema` – Tool invocation record
- `PausePointSchema` – Human-in-the-loop pause definition
- `InterventionSchema` – User intervention record

See [`packages/shared/src/schemas/`](../packages/shared/src/schemas/) for full definitions.

---

## CLI Commands

### caf dev

Starts the development HTTP server for agent monitoring.

```bash
npx caf dev --config ./agent.config.ts
```

**Options:**
- `--config <path>` – Path to agent configuration file
- `--port <number>` – HTTP server port (default: 3000)

### caf mcp

Starts the MCP (Model Context Protocol) server for IDE integration.

```bash
npx caf mcp --config ./agent.config.ts
```

**Options:**
- `--config <path>` – Path to agent configuration file

---

## TypeScript Types

CAF exports full TypeScript types inferred from Zod schemas:

```typescript
import type {
  AgentConfig,
  AgentBlueprint,
  Checkpoint,
  ThoughtChain,
  ThoughtStep,
  Context,
  ToolState,
  ToolCall,
  ToolResult,
  PausePoint,
  Intervention,
  ExecutionProgress,
  AgentEvent,
} from "@liberos/caf-shared"
```

All field names use `snake_case` for consistency with JSON exports.
