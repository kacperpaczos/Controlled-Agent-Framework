import type { Checkpoint, CheckpointReason } from "@liberos/caf-shared"
import { CheckpointSchema } from "@liberos/caf-shared"
import { RuntimeState } from "../runtime/state"
import { CheckpointExporter } from "./exporter"
import { checkpoints, thoughts, toolCalls } from "../storage/schemas"
import { eq } from "drizzle-orm"

export interface CheckpointManagerDeps {
  /** SQLite database via Drizzle ORM - optional; if null, only file-based checkpoints are used */
  db: unknown | null
  exportDir: string
  executionId: string
  agentId: string
  getStepNumber: () => number
  getTokensUsed: () => number
  getStartTime: () => number
}

export class CheckpointManager {
  private exporter: CheckpointExporter
  private db: CheckpointManagerDeps["db"]
  private getStepNumber: () => number
  private getTokensUsed: () => number
  private getStartTime: () => number
  private executionId: string
  private agentId: string
  private exportDir: string

  constructor(deps: CheckpointManagerDeps) {
    this.db = deps.db
    this.executionId = deps.executionId
    this.agentId = deps.agentId
    this.exportDir = deps.exportDir
    this.getStepNumber = deps.getStepNumber
    this.getTokensUsed = deps.getTokensUsed
    this.getStartTime = deps.getStartTime
    this.exporter = new CheckpointExporter(deps.executionId, deps.agentId, deps.exportDir)
  }

  async save(state: RuntimeState, reason: CheckpointReason): Promise<Checkpoint> {
    const checkpoint = await this.exporter.exportToFile(state, {
      step_number: this.getStepNumber(),
      tokens_used: this.getTokensUsed(),
      duration_ms: Date.now() - this.getStartTime(),
      checkpoint_reason: reason,
    })

    if (this.db) {
      const db = this.db as {
        insert: (t: unknown) => { values: (v: object) => Promise<void> }
      }
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

      for (const step of checkpoint.snapshot.thought_chain.steps) {
        await db.insert(thoughts).values({
          id: step.id,
          checkpoint_id: checkpoint.id,
          type: step.type,
          content: step.content,
          reasoning: step.reasoning ?? null,
          confidence: step.confidence,
          parent_id: step.parent_id ?? null,
          children_json: JSON.stringify(step.children),
          metadata_json: step.metadata ? JSON.stringify(step.metadata) : null,
          created_at: step.timestamp,
        })
      }

      for (const call of checkpoint.snapshot.tool_state.completed) {
        await db.insert(toolCalls).values({
          id: call.id,
          checkpoint_id: checkpoint.id,
          tool_id: call.tool_id,
          arguments_json: JSON.stringify(call.arguments),
          result_json: call.result !== undefined ? JSON.stringify(call.result) : null,
          success: call.status === "completed",
          duration_ms: call.duration_ms ?? 0,
          timestamp: call.timestamp,
        })
      }
    }

    return checkpoint
  }

  async restore(checkpointId: string): Promise<RuntimeState> {
    if (this.db) {
      const db = this.db as {
        select: (c: unknown) => { from: (t: unknown) => { where: (c: unknown) => { limit: (n: number) => Promise<{ snapshot_json: string }[]> } } }
      }
      const rows = await db
        .select({ snapshot_json: checkpoints.snapshot_json })
        .from(checkpoints)
        .where(eq(checkpoints.id, checkpointId))
        .limit(1)

      if (rows.length > 0) {
        const parsed = JSON.parse(rows[0].snapshot_json)
        const checkpoint = CheckpointSchema.parse({
          ...parsed,
          id: checkpointId,
          version: "0.0.1",
          execution_id: this.executionId,
          agent_id: this.agentId,
          timestamp: Date.now(),
          snapshot: parsed,
          metadata: {
            step_number: 0,
            tokens_used: 0,
            duration_ms: 0,
            checkpoint_reason: "manual",
            agent_id: this.agentId,
          },
        })
        return RuntimeState.fromCheckpoint(checkpoint)
      }
    }

    const fs = await import("fs")
    const path = await import("path")
    const exportDir = this.exporter["exportDir"]
    const filePath = path.join(exportDir, `${checkpointId}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8")
      const checkpoint = CheckpointSchema.parse(JSON.parse(content))
      return RuntimeState.fromCheckpoint(checkpoint)
    }

    throw new Error(`Checkpoint not found: ${checkpointId}`)
  }

  async export(checkpointId: string): Promise<Checkpoint> {
    const fs = await import("fs")
    const path = await import("path")
    const exportDir = this.exporter["exportDir"]
    const filePath = path.join(exportDir, `${checkpointId}.json`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8")
      return CheckpointSchema.parse(JSON.parse(content))
    }
    if (this.db) {
      const db = this.db as {
        select: () => { from: (t: unknown) => { where: (c: unknown) => { limit: (n: number) => Promise<{ id: string; snapshot_json: string; timestamp: number; execution_id: string; agent_id: string; step_number: number; tokens_used: number; duration_ms: number; checkpoint_reason: string }[]> } } }
      }
      const rows = await db
        .select()
        .from(checkpoints)
        .where(eq(checkpoints.id, checkpointId))
        .limit(1)
      if (rows.length > 0) {
        return CheckpointSchema.parse({
          id: rows[0].id,
          version: "0.0.1",
          timestamp: rows[0].timestamp,
          execution_id: rows[0].execution_id,
          agent_id: rows[0].agent_id,
          snapshot: JSON.parse(rows[0].snapshot_json),
          metadata: {
            step_number: rows[0].step_number,
            tokens_used: rows[0].tokens_used,
            duration_ms: rows[0].duration_ms,
            checkpoint_reason: rows[0].checkpoint_reason,
            agent_id: rows[0].agent_id,
          },
        })
      }
    }
    throw new Error(`Checkpoint not found: ${checkpointId}`)
  }
}
