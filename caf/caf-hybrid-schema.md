# CAF - Hybrid Schema Architecture

## Overview

CAF uses a **3-layer hybrid approach** for data structures, balancing between:

- **Runtime performance** (separated objects)
- **Data portability** (monolithic JSON for export/import)
- **Database efficiency** (normalized tables)

## Architecture Layers

### Layer 1: Runtime (Separated Objects)

During agent execution, state is kept as separate, mutable objects for performance:

```typescript
interface RuntimeState {
  thoughtChain: ThoughtChain // Mutable, easy partial updates
  context: Context // Independent
  toolState: ToolState // Independent
}
```

**Why separated:**

- ✅ Fast partial updates (modify context without touching thoughts)
- ✅ Low memory overhead for small changes
- ✅ Easy to reason about in code
- ✅ Granular event emission

### Layer 2: Checkpoint Export (Monolithic JSON)

When exporting checkpoints (to files or for transfer), state is serialized as a single atomic unit:

```typescript
interface Checkpoint {
  version: "1.0.0"
  id: string
  timestamp: number
  execution_id: string

  // Atomic snapshot - all or nothing
  snapshot: {
    thought_chain: ThoughtChainSnapshot
    context: ContextSnapshot
    tool_state: ToolStateSnapshot
  }

  metadata: {
    step_number: number
    tokens_used: number
    duration_ms: number
  }

  // Optional: delta compression
  diff?: {
    from_checkpoint_id: string
    changes: Record<string, any>
  }
}
```

**Why monolithic for export:**

- ✅ Atomicity - prevents partial/corrupted state
- ✅ Git-friendly - single file per checkpoint
- ✅ Human-readable - complete picture in one JSON
- ✅ Portable - easy import/export between systems
- ✅ Versioning - one schema version for entire checkpoint

### Layer 3: Database (Normalized Tables)

For persistence and querying, data is stored in normalized SQL tables:

```sql
-- Checkpoints table (container)
checkpoints:
  - id: string (PK)
  - timestamp: number
  - execution_id: string (FK)
  - snapshot_json: text -- Full JSON blob for quick restore
  - metadata_json: text -- Queryable metadata

-- Normalized tables for querying
thoughts:
  - id: string (PK)
  - checkpoint_id: string (FK)
  - type: enum
  - content: text
  - confidence: float
  - parent_id: string (FK, nullable)
  - created_at: number

tool_calls:
  - id: string (PK)
  - checkpoint_id: string (FK)
  - tool_id: string
  - arguments: json
  - result: json
  - duration_ms: number
  - success: boolean
```

**Why normalized for database:**

- ✅ Efficient queries ("find all checkpoints where tool X was used")
- ✅ Indexes on specific fields
- ✅ Partial updates without rewriting entire checkpoint
- ✅ Foreign key constraints for data integrity
- ✅ Analytics and reporting

## Data Flow

```
Runtime (Separated)
       │
       │ 1. Create checkpoint
       ▼
Monolithic JSON (Export)
       │
       ├──────► File System (checkpoints/*.json)
       │
       ▼
Database (Normalized)
       │
       │ 2. Query/Restore
       ▼
Runtime (Separated)
```

## Zod Schemas

### Core Components (Separated)

```typescript
// Individual thought step
export const ThoughtStepSchema = z.object({
  id: z.string(),
  type: z.enum(["planning", "reasoning", "tool_selection", "tool_execution", "reflection", "decision"]),
  content: z.string(),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1),
  parent_id: z.string().optional(),
  children: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number(),
})

// Thought chain
export const ThoughtChainSchema = z.object({
  current_step_id: z.string().optional(),
  steps: z.array(ThoughtStepSchema),
})

// Context
export const ContextSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool"]),
      content: z.string(),
      tool_calls: z.any().optional(),
      tool_results: z.any().optional(),
    }),
  ),
  variables: z.record(z.string(), z.any()),
  memory: z
    .array(
      z.object({
        key: z.string(),
        value: z.any(),
        importance: z.number(),
      }),
    )
    .optional(),
})

// Tool state
export const ToolStateSchema = z.object({
  last_tool_call_id: z.string().optional(),
  pending: z.array(z.string()),
  completed: z.array(
    z.object({
      tool_id: z.string(),
      arguments: z.record(z.any()),
      result: z.any(),
      success: z.boolean(),
      duration_ms: z.number(),
      timestamp: z.number(),
    }),
  ),
})
```

### Monolithic Checkpoint

```typescript
export const CheckpointSchema = z.object({
  version: z.literal("1.0.0"),
  id: z.string(),
  timestamp: z.number(),
  execution_id: z.string(),
  agent_id: z.string(),

  // Full atomic snapshot
  snapshot: z.object({
    thought_chain: ThoughtChainSchema,
    context: ContextSchema,
    tool_state: ToolStateSchema,
  }),

  // Metadata
  metadata: z.object({
    step_number: z.number().int().nonnegative(),
    total_steps_estimate: z.number().optional(),
    tokens_used: z.number().int().nonnegative(),
    duration_ms: z.number().nonnegative(),
    checkpoint_reason: z.enum(["step_complete", "manual", "low_confidence", "tool_error", "auto"]),
  }),

  // Optional diff from previous checkpoint
  diff: z.optional(
    z.object({
      from_checkpoint_id: z.string(),
      changes: z.record(
        z.string(),
        z.object({
          before: z.any(),
          after: z.any(),
        }),
      ),
      summary: z.string(),
    }),
  ),

  // Optional: parent/branch info
  parent: z.optional(
    z.object({
      checkpoint_id: z.string(),
      is_branch: z.boolean().default(false),
      branch_reason: z.string().optional(),
    }),
  ),
})
```

## Database Schema (Drizzle)

```typescript
// Drizzle ORM schema definition
export const checkpoints = sqliteTable("checkpoints", {
  id: text("id").primaryKey(),
  timestamp: integer("timestamp").notNull(),
  execution_id: text("execution_id").notNull(),
  agent_id: text("agent_id").notNull(),

  // Full JSON for quick restore
  snapshot_json: text("snapshot_json").notNull(),

  // Queryable metadata (denormalized)
  step_number: integer("step_number").notNull(),
  tokens_used: integer("tokens_used").notNull(),
  duration_ms: integer("duration_ms").notNull(),
  checkpoint_reason: text("checkpoint_reason").notNull(),

  // Optional references
  parent_checkpoint_id: text("parent_checkpoint_id"),
  is_branch: integer("is_branch", { mode: "boolean" }).default(false),
})

export const thoughts = sqliteTable("thoughts", {
  id: text("id").primaryKey(),
  checkpoint_id: text("checkpoint_id")
    .notNull()
    .references(() => checkpoints.id),
  type: text("type").notNull(), // planning, reasoning, etc.
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  confidence: real("confidence"),
  parent_id: text("parent_id"),
  children_json: text("children_json"), // JSON array of IDs
  metadata_json: text("metadata_json"),
  created_at: integer("created_at").notNull(),
})

export const toolCalls = sqliteTable("tool_calls", {
  id: text("id").primaryKey(),
  checkpoint_id: text("checkpoint_id")
    .notNull()
    .references(() => checkpoints.id),
  tool_id: text("tool_id").notNull(),
  arguments_json: text("arguments_json").notNull(),
  result_json: text("result_json"),
  success: integer("success", { mode: "boolean" }).notNull(),
  duration_ms: integer("duration_ms").notNull(),
  timestamp: integer("timestamp").notNull(),
})
```

## Usage Examples

### Runtime → Checkpoint Export

```typescript
// During execution
const runtimeState = {
  thoughtChain: new ThoughtChain(),
  context: new Context(),
  toolState: new ToolState(),
}

// Create checkpoint
const checkpoint: Checkpoint = {
  version: "1.0.0",
  id: generateId(),
  timestamp: Date.now(),
  execution_id: this.executionId,
  agent_id: this.agentId,

  snapshot: {
    thought_chain: runtimeState.thoughtChain.toJSON(),
    context: runtimeState.context.toJSON(),
    tool_state: runtimeState.toolState.toJSON(),
  },

  metadata: {
    step_number: this.currentStep,
    tokens_used: this.tokenCount,
    duration_ms: Date.now() - this.startTime,
    checkpoint_reason: "step_complete",
  },
}

// Export to file
await Bun.write(`checkpoints/${checkpoint.id}.json`, JSON.stringify(checkpoint, null, 2))
```

### Checkpoint Import → Runtime

```typescript
// Load checkpoint
const checkpointData = await Bun.file(`checkpoints/${id}.json`).json()
const checkpoint = CheckpointSchema.parse(checkpointData)

// Restore runtime state
const runtimeState = {
  thoughtChain: ThoughtChain.fromJSON(checkpoint.snapshot.thought_chain),
  context: Context.fromJSON(checkpoint.snapshot.context),
  toolState: ToolState.fromJSON(checkpoint.snapshot.tool_state),
}
```

### Database Operations

```typescript
// Save checkpoint (both full JSON and normalized)
await db.insert(checkpoints).values({
  id: checkpoint.id,
  timestamp: checkpoint.timestamp,
  execution_id: checkpoint.execution_id,
  agent_id: checkpoint.agent_id,
  snapshot_json: JSON.stringify(checkpoint.snapshot),
  step_number: checkpoint.metadata.step_number,
  tokens_used: checkpoint.metadata.tokens_used,
  duration_ms: checkpoint.metadata.duration_ms,
  checkpoint_reason: checkpoint.metadata.checkpoint_reason,
})

// Save normalized thoughts
await db.insert(thoughts).values(
  checkpoint.snapshot.thought_chain.steps.map((step) => ({
    id: step.id,
    checkpoint_id: checkpoint.id,
    type: step.type,
    content: step.content,
    reasoning: step.reasoning,
    confidence: step.confidence,
    parent_id: step.parent_id,
    children_json: JSON.stringify(step.children),
    metadata_json: step.metadata ? JSON.stringify(step.metadata) : null,
    created_at: step.timestamp,
  })),
)

// Query: Find all checkpoints with low confidence thoughts
const lowConfidenceCheckpoints = await db
  .select({ checkpoint_id: thoughts.checkpoint_id })
  .from(thoughts)
  .where(lt(thoughts.confidence, 0.7))
  .groupBy(thoughts.checkpoint_id)
```

## Decision Matrix

| Use Case               | Format            | Location                 | Reason                       |
| ---------------------- | ----------------- | ------------------------ | ---------------------------- |
| **Runtime execution**  | Separated objects | Memory                   | Performance, partial updates |
| **File export/import** | Monolithic JSON   | `checkpoints/*.json`     | Portability, git-friendly    |
| **Quick restore**      | Monolithic JSON   | Database `snapshot_json` | Single query, fast           |
| **Complex queries**    | Normalized tables | Database                 | Indexes, joins, analytics    |
| **GUI visualization**  | Either            | API response             | Depends on view              |
| **WebSocket sync**     | Monolithic + diff | Network                  | Atomic updates               |

## Benefits of Hybrid Approach

1. **No compromises**: Best of both worlds for different use cases
2. **Performance**: Runtime doesn't suffer from monolithic overhead
3. **Reliability**: Checkpoints are atomic and portable
4. **Flexibility**: Database allows complex queries
5. **Developer experience**: Easy to debug (readable JSON files)
6. **Versioning**: Checkpoints have schema version, can be migrated

## Migration Strategy

When schema changes:

1. **Minor changes** (add optional fields): backward compatible
2. **Major changes**: bump version, provide migration script
3. **Database migrations**: Drizzle handles table changes
4. **Runtime objects**: can evolve independently

```typescript
// Version handling
if (checkpoint.version === "1.0.0") {
  // Current version
} else if (checkpoint.version === "0.9.0") {
  // Migrate from old version
  checkpoint = migrateFrom090(checkpoint)
}
```
