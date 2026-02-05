import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"

export const ConsiderationSchema = z.object({
  option: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  selected: z.boolean(),
  selection_reason: z.string(),
})

export const DecisionSchema = z.object({
  action: z.string(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  uncertainty_factors: z.array(z.string()).optional(),
})

export const SourceAttributionSchema = z.object({
  source_type: z.enum(["previous_thought", "tool_result", "user_message", "context", "instruction"]),
  source_id: IDSchema,
  relevance_score: z.number().min(0).max(1),
})

export const ReasoningTraceSchema = z.object({
  id: IDSchema,
  thought_step_id: IDSchema,

  goal: z.string(),
  considerations: z.array(ConsiderationSchema),
  decision: DecisionSchema,

  derived_from: z.array(SourceAttributionSchema),

  leads_to: z.array(
    z.object({
      next_step_id: IDSchema,
      expected_outcome: z.string(),
      conditions: z.array(z.string()),
    }),
  ),

  created_at: TimestampSchema,
})

export type ReasoningTrace = z.infer<typeof ReasoningTraceSchema>
