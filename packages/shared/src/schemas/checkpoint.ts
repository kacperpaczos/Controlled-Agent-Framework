import { z } from "zod"
import { IDSchema, TimestampSchema, VersionSchema } from "../core"
import { ThoughtChainSchema } from "./thought"
import { ContextSchema } from "./context"
import { ToolStateSchema } from "./tool"
import { ExecutionProgressSchema } from "./agent"

export const CheckpointReasonSchema = z.enum([
  "step_complete",
  "manual",
  "low_confidence",
  "tool_error",
  "auto",
  "decision",
  "branch",
])

export const CheckpointMetadataSchema = z.object({
  step_number: z.number().int().nonnegative(),
  total_steps_estimate: z.number().int().positive().optional(),
  tokens_used: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  checkpoint_reason: CheckpointReasonSchema,
  agent_name: z.string().optional(),
  agent_id: IDSchema,
})

export const CheckpointParentSchema = z.object({
  checkpoint_id: IDSchema,
  is_branch: z.boolean().default(false),
  branch_reason: z.string().optional(),
})

export const CheckpointDiffSchema = z.object({
  from_checkpoint_id: IDSchema,
  changes: z.record(
    z.string(),
    z.object({
      before: z.any(),
      after: z.any(),
    }),
  ),
  summary: z.string(),
})

export const CheckpointSchema = z.object({
  version: VersionSchema,
  id: IDSchema,
  timestamp: TimestampSchema,
  execution_id: IDSchema,
  agent_id: IDSchema,

  snapshot: z.object({
    thought_chain: ThoughtChainSchema,
    context: ContextSchema,
    tool_state: ToolStateSchema,
    progress: ExecutionProgressSchema,
  }),

  metadata: CheckpointMetadataSchema,

  diff: CheckpointDiffSchema.optional(),

  parent: CheckpointParentSchema.optional(),

  name: z.string().optional(),
  description: z.string().optional(),
})

export type CheckpointReason = z.infer<typeof CheckpointReasonSchema>
export type CheckpointMetadata = z.infer<typeof CheckpointMetadataSchema>
export type Checkpoint = z.infer<typeof CheckpointSchema>
