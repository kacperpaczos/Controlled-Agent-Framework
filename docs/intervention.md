# Human-in-the-Loop (HITL) Intervention

CAF's intervention system enables **human oversight and control** during agent execution. Agents can pause mid-execution, present context to users, and wait for decisions before continuing.

## Core Concepts

### Pause Points

A **pause point** is a programmatic stop in agent execution that requires human input to proceed. Pause points are triggered by:

- **Manual pauses** – Explicit request via API or GUI
- **Tool errors** – When a tool execution fails
- **Low confidence** – When agent confidence drops below threshold
- **Custom triggers** – User-defined conditions

### Intervention Flow

```
Agent Running
     │
     │ Trigger condition met
     ▼
Agent Paused
     │
     │ Emit "agent.paused" event with PausePoint
     ▼
User Reviews Context
     │
     │ Choose action: continue | modify | cancel | retry
     ▼
Agent Resumed (or cancelled)
```

## Configuration

Enable pause triggers in `AgentConfig`:

```typescript
const agent = new AgentEngine({
  name: "hitl-agent",
  instructions: "You analyze code and suggest improvements.",
  pause: {
    manual: true,              // Allow manual pauses via API
    on_tool_error: true,       // Pause when any tool fails
    on_low_confidence: 0.6,   // Pause if confidence < 0.6 (60%)
  },
  checkpoints: { enabled: true },
})
```

## Pause Triggers

### 1. Manual Pause

Programmatically pause execution:

```typescript
// During execution (from another thread/process)
await agent.pause({ reason: "User requested review" })
```

Or via GUI/API endpoint when agent is running.

### 2. Tool Error

Automatically pause when a tool execution fails:

```typescript
agent.on("agent.paused", (event) => {
  if (event.pause_point.trigger === "tool_error") {
    const { tool_id, error } = event.pause_point.trigger_details
    console.log(`Tool ${tool_id} failed: ${error}`)
    // Prompt user to fix issue or cancel
  }
})
```

### 3. Low Confidence

Pause when agent's confidence in a decision drops below threshold:

```typescript
agent.on("agent.paused", (event) => {
  if (event.pause_point.trigger === "confidence_low") {
    const thought = event.pause_point.trigger_details.thought
    console.log(`Low confidence (${thought.confidence}): ${thought.content}`)
    // User can review reasoning and decide
  }
})
```

### 4. Custom Triggers (Advanced)

Implement custom pause logic using hooks:

```typescript
agent.registerHook("before_tool_call", async (context) => {
  if (context.tool_id === "write_file" && context.args.path.includes("production")) {
    return { pause: true, reason: "Production file modification requires approval" }
  }
})
```

## PausePoint Structure

When an agent pauses, it emits an `agent.paused` event with a `PausePoint` object:

```typescript
interface PausePoint {
  id: string                     // Unique pause point ID
  execution_id: string           // Current execution ID
  checkpoint_id: string          // Checkpoint at pause moment
  trigger: string                // "manual" | "tool_error" | "confidence_low" | "custom"
  trigger_details: {
    tool_id?: string
    error?: string
    thought?: ThoughtStep
    confidence?: number
    custom_reason?: string
  }
  status_summary: string         // Human-readable summary
  pending_questions?: string[]   // Questions for user
  available_actions: string[]    // ["continue", "cancel", "modify", "retry"]
  timeout_ms?: number            // Auto-action after timeout
  on_timeout?: string            // Default action if timeout
  created_at: number             // Timestamp
}
```

## Handling Pauses

### Event Listener

```typescript
agent.on("agent.paused", async (event) => {
  const { pause_point } = event

  console.log(`Paused: ${pause_point.trigger}`)
  console.log(`Status: ${pause_point.status_summary}`)
  console.log(`Actions: ${pause_point.available_actions.join(", ")}`)

  // Present to user via CLI, GUI, or other interface
  // User selects action...

  // Resume with chosen action (API depends on transport layer)
  // await agent.resume(pause_point.id, { action: "continue" })
})
```

### Programmatic Resume

```typescript
// Continue execution without modifications
await agent.resume(pausePointId, { action: "continue" })

// Cancel execution
await agent.resume(pausePointId, { action: "cancel" })

// Modify state and continue
await agent.resume(pausePointId, {
  action: "modify",
  modifications: {
    context: { variables: { new_var: "value" } },
    retry_tool: true,
  },
})

// Retry last failed operation
await agent.resume(pausePointId, { action: "retry" })
```

## Available Actions

The `available_actions` array in `PausePoint` defines what users can do. Common actions:

| Action | Description |
|--------|-------------|
| `continue` | Resume execution without changes |
| `cancel` | Stop execution completely |
| `modify` | Edit context/state and resume |
| `retry` | Retry last failed operation (e.g., tool call) |
| `skip` | Skip current step and move to next |
| `rollback` | Restore previous checkpoint |

Actions are context-sensitive. For example, `retry` is only available when `trigger === "tool_error"`.

## Timeout Behavior

To prevent indefinite pauses, specify `timeout_ms` and `on_timeout`:

```typescript
const pausePoint = {
  // ... other fields
  timeout_ms: 30000,        // 30 seconds
  on_timeout: "cancel",     // Auto-cancel if no response
}
```

When timeout expires, the agent automatically performs `on_timeout` action and emits `agent.resumed` event.

## Intervention Records

All interventions are recorded in the database (if enabled):

```sql
CREATE TABLE interventions (
  id TEXT PRIMARY KEY,
  pause_point_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  action TEXT NOT NULL,         -- "continue", "cancel", "modify", etc.
  modifications_json TEXT,      -- JSON of modifications (if action=modify)
  performed_by TEXT,            -- User ID or "system" (for timeout)
  performed_at INTEGER NOT NULL,
  FOREIGN KEY (pause_point_id) REFERENCES pause_points(id)
);
```

This allows querying intervention history for analytics and auditing.

## GUI Integration

In **Sentinel** (the optional Next.js GUI), the Intervention Panel displays:

- Active pause point details
- Status summary and pending questions
- Buttons for each `available_actions`
- Countdown timer if `timeout_ms` is set
- Historical interventions for the execution

When user clicks an action button, the GUI sends a WebSocket message to the agent's dev server, which calls `agent.resume()`.

## Use Cases

### 1. Code Refactoring with Approval

```typescript
const agent = new AgentEngine({
  name: "refactor-agent",
  pause: { manual: true },
})

agent.registerHook("before_tool_call", async (ctx) => {
  if (ctx.tool_id === "edit_file") {
    return {
      pause: true,
      reason: "File modification requires review",
      questions: ["Is this refactoring safe?", "Does it preserve functionality?"],
    }
  }
})
```

### 2. Error Recovery

```typescript
agent.on("agent.paused", async (event) => {
  if (event.pause_point.trigger === "tool_error") {
    const error = event.pause_point.trigger_details.error
    if (error.includes("ENOENT")) {
      console.log("File not found. Creating directory...")
      // Fix issue, then retry
      await agent.resume(event.pause_point.id, { action: "retry" })
    }
  }
})
```

### 3. Confidence-Based Review

```typescript
const agent = new AgentEngine({
  pause: { on_low_confidence: 0.7 },
})

agent.on("agent.paused", async (event) => {
  if (event.pause_point.trigger === "confidence_low") {
    const thought = event.pause_point.trigger_details.thought
    console.log(`Agent uncertain: "${thought.content}"`)
    console.log(`Confidence: ${thought.confidence}`)
    // User reviews reasoning traces, then decides
  }
})
```

## Best Practices

1. **Always handle `agent.paused` events** – Unhandled pauses will hang execution
2. **Set reasonable timeouts** – Prevent indefinite waits in production
3. **Record interventions** – Audit trail for compliance and debugging
4. **Provide context** – Include relevant state in `pending_questions` and `status_summary`
5. **Test pause/resume paths** – Ensure state consistency after modifications
6. **Use confidence thresholds wisely** – Too low = too many pauses; too high = missed issues

## API Reference

See [API Reference](api-reference.md) for:

- `agent.on("agent.paused", handler)` event documentation
- `agent.resume(pausePointId, options)` method (transport-dependent)
- `PausePointSchema` and `InterventionSchema` in `@liberos/caf-shared`

## Implementation Details

- Pause points are checkpoints with special metadata (`checkpoint_reason: "pause"`)
- When paused, agent execution is awaited on a promise that resolves when `resume()` is called
- Modifications during `modify` action are validated against schemas before resuming
- All state changes during intervention are logged in `interventions` table

See [`packages/caf/src/intervention/pause.ts`](../packages/caf/src/intervention/pause.ts) for full implementation.

## Related Documentation

- [Checkpoint System](checkpoint-system.md) – State persistence during pauses
- [Getting Started](getting-started.md) – Basic pause/resume examples
- [Architecture](architecture/specification.md) – HITL design philosophy
