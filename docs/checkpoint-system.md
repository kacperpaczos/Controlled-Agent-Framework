# Checkpoint System

CAF's checkpoint system provides complete state persistence and restore capabilities through a **3-layer hybrid architecture** that balances runtime performance, portability, and query efficiency.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Runtime Layer                        │
│  (In-memory, separated objects for fast updates)       │
│                                                         │
│  • ThoughtChain    • Context    • ToolState            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Checkpoint Event
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Export Layer (JSON)                    │
│  (Monolithic files for portability & git-friendliness) │
│                                                         │
│  File: checkpoints/{id}.json                           │
│  {                                                      │
│    version: "0.0.1",                                   │
│    id: "ckpt_abc123",                                  │
│    snapshot: { thought_chain, context, tool_state }   │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Optional: Database Sync
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Database Layer (SQLite)                    │
│  (Normalized tables for querying & analytics)          │
│                                                         │
│  Tables: checkpoints, thoughts, tool_calls, executions │
└─────────────────────────────────────────────────────────┘
```

## Layer 1: Runtime State

During execution, the agent maintains state as **separated, mutable objects** for optimal performance.

### Structure

```typescript
interface RuntimeState {
  thought_chain: ThoughtChain   // Array of ThoughtStep objects
  context: Context              // Variables, state, history
  tool_state: ToolState         // Tool call records
  progress: ExecutionProgress   // Counters, metrics
}
```

### Benefits

- **Fast partial updates** – Modify context without touching thoughts
- **Low memory overhead** – Only changed objects are cloned
- **Granular events** – Emit specific events (e.g., `thought.created`) without serializing entire state
- **Easy reasoning** – Code operates on simple object references

### Implementation

See [`packages/caf/src/runtime/state.ts`](../packages/caf/src/runtime/state.ts) for the `RuntimeState` class.

## Layer 2: Checkpoint Export (Monolithic JSON)

Checkpoints are **atomic snapshots** saved as single JSON files for portability and human readability.

### File Format

```json
{
  "version": "0.0.1",
  "id": "ckpt_abc123",
  "timestamp": 1738790400000,
  "execution_id": "exec_xyz",
  "agent_id": "my-agent",
  "snapshot": {
    "thought_chain": [
      {
        "id": "thought_001",
        "type": "reasoning",
        "content": "I need to analyze the codebase structure",
        "confidence": 0.85,
        "created_at": 1738790300000
      }
    ],
    "context": {
      "variables": { "task": "code analysis" },
      "state": {},
      "history": []
    },
    "tool_state": {
      "calls": [],
      "results": {}
    },
    "progress": {
      "step_number": 1,
      "total_thoughts": 1,
      "total_tool_calls": 0
    }
  },
  "metadata": {
    "step_number": 1,
    "tokens_used": 250,
    "duration_ms": 1200,
    "checkpoint_reason": "thought_completed"
  }
}
```

### Benefits

- **Atomicity** – Prevents partial/corrupted state (all-or-nothing write)
- **Git-friendly** – One file per checkpoint, easy diffing
- **Human-readable** – Inspect state without tools
- **Portable** – Export/import between systems, archive in S3, etc.
- **Versioned** – Schema version field for migration support

### Default Location

By default, checkpoints are saved to `./checkpoints/` (configurable via `checkpoints.export_dir`).

### Implementation

See [`packages/caf/src/checkpoints/exporter.ts`](../packages/caf/src/checkpoints/exporter.ts) and [`packages/caf/src/checkpoints/manager.ts`](../packages/caf/src/checkpoints/manager.ts).

## Layer 3: Database Storage (SQLite)

For querying, analytics, and fast restore, checkpoints are **optionally** stored in a normalized SQLite database.

### Schema

```sql
-- Container table with full JSON blob
CREATE TABLE checkpoints (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  execution_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,  -- Full snapshot as JSON
  metadata_json TEXT NOT NULL,  -- Metadata as JSON
  FOREIGN KEY (execution_id) REFERENCES executions(id)
);

-- Normalized tables for efficient queries
CREATE TABLE thoughts (
  id TEXT PRIMARY KEY,
  checkpoint_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'reasoning', 'observation', 'action'
  content TEXT NOT NULL,
  confidence REAL,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id),
  FOREIGN KEY (parent_id) REFERENCES thoughts(id)
);

CREATE TABLE tool_calls (
  id TEXT PRIMARY KEY,
  checkpoint_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  args_json TEXT NOT NULL,
  result_json TEXT,
  success INTEGER NOT NULL,     -- 0 or 1
  error TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
);

CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  status TEXT NOT NULL          -- 'running', 'paused', 'completed', 'failed'
);
```

### Benefits

- **Efficient queries** – "Find all checkpoints where tool X was called"
- **Indexes** – Fast lookups by timestamp, execution_id, etc.
- **Partial updates** – Update metadata without rewriting entire checkpoint
- **Foreign keys** – Data integrity constraints
- **Analytics** – Aggregate queries (e.g., avg tokens per execution)

### Enabling Database Storage

```typescript
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"

const sqlite = new Database("./data/checkpoints.db")
const db = drizzle(sqlite)

agent.setDatabase(db)
```

### Implementation

See [`packages/caf/src/storage/schemas.ts`](../packages/caf/src/storage/schemas.ts) for Drizzle ORM table definitions.

## Checkpoint Lifecycle

### 1. Creation

Checkpoints are created automatically during execution at key points:

- After each thought completion
- After tool execution
- On pause (human-in-the-loop)
- On manual request
- On execution completion

### 2. Saving

The `CheckpointManager` handles hybrid saving:

1. Serialize `RuntimeState` to `Checkpoint` object
2. Validate against `CheckpointSchema` (Zod)
3. Write JSON file to `export_dir`
4. If database is configured:
   - Insert into `checkpoints` table (with `snapshot_json`)
   - Insert normalized records into `thoughts`, `tool_calls`
5. Emit `agent.checkpoint` event

### 3. Restoration

To restore from a checkpoint:

```typescript
const checkpoint = await agent.exportCheckpoint("ckpt_abc123")
await agent.restoreCheckpoint(checkpoint)

// Resume execution from that point
const result = await agent.run("Continue task", {
  resumeFrom: checkpoint.id,
})
```

**Restore process:**

1. Read checkpoint (from file or database)
2. Validate schema version
3. Reconstruct `RuntimeState` from `snapshot`
4. Set internal agent state
5. Next `run()` call starts from that state

### 4. Diffing

Compare two checkpoints to see what changed:

```typescript
import { diffCheckpoints } from "@liberos/caf"

const diff = diffCheckpoints(checkpoint1, checkpoint2)
console.log(diff.thoughts_added)     // New thoughts
console.log(diff.tool_calls_added)   // New tool calls
console.log(diff.context_changes)    // Variable modifications
```

## Checkpoint Metadata

Each checkpoint includes metadata for tracking execution progress:

```typescript
interface CheckpointMetadata {
  step_number: number          // Sequential step in execution
  tokens_used: number          // Cumulative token count
  duration_ms: number          // Time since execution start
  checkpoint_reason: string    // Why this checkpoint was created
}
```

## Export and Import

### Export to file system

```typescript
const checkpoint = await agent.exportCheckpoint("ckpt_abc123")
// checkpoint is a JSON object, can be saved anywhere
```

### Import from external source

```typescript
import fs from "fs"

const checkpoint = JSON.parse(fs.readFileSync("./backup/ckpt_abc123.json", "utf-8"))
await agent.restoreCheckpoint(checkpoint)
```

### Git integration

Checkpoint JSON files are git-friendly:

```bash
git add checkpoints/ckpt_abc123.json
git commit -m "Checkpoint: completed code analysis"
git push
```

Team members can pull and restore checkpoints to reproduce exact agent state.

## Schema Versioning

All checkpoints include a `version` field (e.g., `"0.0.1"`). Future versions can:

- Migrate old checkpoints with transformation functions
- Reject incompatible versions with clear error messages
- Provide upgrade paths for users

## Best Practices

1. **Enable checkpoints for all agents** – Minimal overhead, huge debugging value
2. **Use database for production** – Faster queries, better analytics
3. **Keep JSON exports for archives** – Long-term portability
4. **Review checkpoint diffs** – Understand agent reasoning changes
5. **Version checkpoint schemas** – Plan for future migrations
6. **Clean old checkpoints** – Prevent disk bloat (e.g., keep last 100 per execution)

## Related Documentation

- [API Reference](api-reference.md) – `exportCheckpoint()`, `restoreCheckpoint()` methods
- [Architecture](architecture/data-layers.md) – Deep dive into 3-layer design rationale
- [Getting Started](getting-started.md) – Basic checkpoint usage examples
