import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"
import { ThoughtTypeSchema } from "./thought"
import { CheckpointReasonSchema } from "./checkpoint"

export const DbCheckpointSchema = z.object({
  id: IDSchema,
  timestamp: TimestampSchema,
  execution_id: IDSchema,
  agent_id: IDSchema,

  snapshot_json: z.string(),

  step_number: z.number().int().nonnegative(),
  tokens_used: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  checkpoint_reason: CheckpointReasonSchema,

  parent_checkpoint_id: IDSchema.optional(),
  is_branch: z.boolean().default(false),
  branch_reason: z.string().optional(),

  name: z.string().optional(),
  description: z.string().optional(),
})

export const DbThoughtSchema = z.object({
  id: IDSchema,
  checkpoint_id: IDSchema,
  type: ThoughtTypeSchema,
  content: z.string(),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  parent_id: IDSchema.optional(),
  children_json: z.string(),
  metadata_json: z.string().optional(),
  created_at: TimestampSchema,
})

export const DbToolCallSchema = z.object({
  id: IDSchema,
  checkpoint_id: IDSchema,
  tool_id: IDSchema,
  arguments_json: z.string(),
  result_json: z.string().optional(),
  success: z.boolean(),
  duration_ms: z.number().nonnegative(),
  timestamp: TimestampSchema,
})

export const DbExecutionSchema = z.object({
  id: IDSchema,
  agent_id: IDSchema,
  status: z.enum(["pending", "running", "paused", "completed", "failed", "cancelled"]),
  started_at: TimestampSchema,
  ended_at: TimestampSchema.optional(),
  current_checkpoint_id: IDSchema.optional(),
  total_tokens: z.number().int().nonnegative().default(0),
  metadata_json: z.string().optional(),
})

export type DbCheckpoint = z.infer<typeof DbCheckpointSchema>
export type DbThought = z.infer<typeof DbThoughtSchema>
export type DbToolCall = z.infer<typeof DbToolCallSchema>
export type DbExecution = z.infer<typeof DbExecutionSchema>
