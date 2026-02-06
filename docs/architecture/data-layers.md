# CAF - Hybrid Data Architecture

## Overview

CAF uses a **3-layer hybrid approach** for data structures, balancing:

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
  version: "0.0.1"
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

## Implementation

See [`packages/caf/src/runtime/state.ts`](../../packages/caf/src/runtime/state.ts), [`packages/caf/src/checkpoints/manager.ts`](../../packages/caf/src/checkpoints/manager.ts), and [`packages/caf/src/storage/schemas.ts`](../../packages/caf/src/storage/schemas.ts) for the full implementation.
