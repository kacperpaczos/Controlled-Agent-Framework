import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"

export const ThoughtTypeSchema = z.enum([
  "planning",
  "reasoning",
  "tool_selection",
  "tool_execution",
  "reflection",
  "decision",
  "observation",
  "correction",
])

export const ThoughtStepSchema = z.object({
  id: IDSchema,
  type: ThoughtTypeSchema,
  content: z.string(),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1),
  alternatives: z
    .array(
      z.object({
        option: z.string(),
        reason_rejected: z.string(),
        confidence: z.number().optional(),
      }),
    )
    .optional(),
  parent_id: IDSchema.optional(),
  children: z.array(IDSchema),
  metadata: z.record(z.any()).optional(),
  timestamp: TimestampSchema,
})

export const ThoughtChainSchema = z.object({
  current_step_id: IDSchema.optional(),
  steps: z.array(ThoughtStepSchema),
})

export type ThoughtType = z.infer<typeof ThoughtTypeSchema>
export type ThoughtStep = z.infer<typeof ThoughtStepSchema>
export type ThoughtChain = z.infer<typeof ThoughtChainSchema>
