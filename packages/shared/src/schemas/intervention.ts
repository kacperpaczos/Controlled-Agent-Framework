import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"

export const PauseTriggerSchema = z.enum([
  "tool_confirmation",
  "tool_error",
  "human_review",
  "timeout",
  "confidence_low",
  "manual",
  "branch_point",
  "clarification_needed",
])

export const PauseActionSchema = z.enum(["approve", "reject", "modify", "continue", "escalate", "cancel", "retry"])

export const PausePointSchema = z.object({
  id: IDSchema,
  execution_id: IDSchema,
  checkpoint_id: IDSchema,

  trigger: PauseTriggerSchema,
  trigger_details: z.record(z.any()),

  status_summary: z.string(),
  pending_questions: z.array(z.string()),

  available_actions: z.array(
    z.object({
      id: IDSchema,
      label: z.string(),
      description: z.string(),
      type: PauseActionSchema,
      parameters: z
        .record(
          z.string(),
          z.object({
            type: z.string(),
            required: z.boolean(),
            description: z.string(),
          }),
        )
        .optional(),
    }),
  ),

  timeout_ms: z.number().optional(),
  on_timeout: PauseActionSchema.optional(),

  created_at: TimestampSchema,
  resolved_at: TimestampSchema.optional(),
})

export const InterventionResponseSchema = z.object({
  action: PauseActionSchema,
  notes: z.string().optional(),
  modified_state: z.record(z.any()).optional(),
  modified_decision: z
    .object({
      decision_id: IDSchema,
      new_value: z.any(),
      reason: z.string(),
    })
    .optional(),
  suggested_prompt: z.string().optional(),
})

export const InterventionSchema = z.object({
  id: IDSchema,
  execution_id: IDSchema,
  pause_point_id: IDSchema,

  requested_at: TimestampSchema,
  responded_at: TimestampSchema.optional(),
  responder: z.string().optional(),

  response: InterventionResponseSchema.optional(),
})

export type PauseTrigger = z.infer<typeof PauseTriggerSchema>
export type PauseAction = z.infer<typeof PauseActionSchema>
export type PausePoint = z.infer<typeof PausePointSchema>
export type Intervention = z.infer<typeof InterventionSchema>
