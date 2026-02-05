import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"
import { ThoughtTypeSchema } from "./thought"
import { CheckpointSchema } from "./checkpoint"
import { PausePointSchema, InterventionSchema } from "./intervention"
import { AgentEventSchema } from "./event"

export const ThoughtVisualizationSchema = z.object({
  thought_id: IDSchema,
  content: z.string(),
  type: ThoughtTypeSchema,
  level: z.number().int().nonnegative().default(0),
  parent_id: IDSchema.optional(),

  reasoning: z
    .object({
      goal: z.string(),
      approach: z.string(),
      steps: z.array(
        z.object({
          step: z.string(),
          explanation: z.string(),
        }),
      ),
      conclusion: z.string(),
    })
    .optional(),

  confidence: z
    .object({
      value: z.number().min(0).max(1),
      factors: z.array(
        z.object({
          factor: z.string(),
          impact: z.enum(["positive", "negative"]),
          weight: z.number(),
        }),
      ),
    })
    .optional(),

  alternatives: z
    .array(
      z.object({
        option: z.string(),
        why_not_chosen: z.string(),
        confidence: z.number().optional(),
      }),
    )
    .optional(),

  sources: z.array(
    z.object({
      source_type: z.enum(["context", "memory", "tool", "instruction", "user"]),
      source_id: IDSchema,
      excerpt: z.string(),
      relevance: z.number(),
    }),
  ),

  editable: z.boolean().default(false),
})

export const ExecutionTraceSchema = z.object({
  execution_id: IDSchema,
  timeline: z.array(
    z.object({
      timestamp: TimestampSchema,
      event: z.enum([
        "agent_start",
        "thought_start",
        "thought_complete",
        "tool_call",
        "tool_result",
        "decision",
        "context_update",
        "pause",
        "resume",
        "checkpoint",
        "branch",
        "error",
        "agent_end",
      ]),
      thought_id: IDSchema.optional(),
      tool_id: IDSchema.optional(),
      duration: z.number().optional(),
      details: z.record(z.any()),
    }),
  ),

  stats: z.object({
    total_thoughts: z.number().int(),
    total_tools: z.number().int(),
    total_decisions: z.number().int(),
    total_pauses: z.number().int(),
    total_duration: z.number(),
    tokens_used: z.number(),
  }),
})

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
})

export const WebSocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("event"),
    event: AgentEventSchema,
  }),
  z.object({
    type: z.literal("checkpoint_update"),
    checkpoint: CheckpointSchema,
  }),
  z.object({
    type: z.literal("intervention_request"),
    pause_point: PausePointSchema,
  }),
  z.object({
    type: z.literal("intervention_response"),
    intervention: InterventionSchema,
  }),
])

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>
