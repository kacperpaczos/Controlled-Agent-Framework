import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"

export const AgentBlockTypeSchema = z.enum([
  "system_prompt",
  "instruction",
  "tool",
  "condition",
  "loop",
  "branch",
  "memory",
  "context_filter",
  "output_format",
  "human_review",
])

export const AgentBlockSchema = z.object({
  id: IDSchema,
  type: AgentBlockTypeSchema,
  name: z.string(),
  description: z.string().optional(),

  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),

  connections: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        type: z.enum(["data", "control", "error"]),
      }),
    )
    .optional(),

  config: z.record(z.any()),
})

export const AgentBlueprintSchema = z.object({
  id: IDSchema,
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),

  blocks: z.array(AgentBlockSchema),
  entry_point: IDSchema,
  end_points: z.array(IDSchema),

  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  author: z.string().optional(),

  validation_errors: z
    .array(
      z.object({
        block_id: IDSchema,
        error: z.string(),
        severity: z.enum(["error", "warning", "info"]),
      }),
    )
    .optional(),
})

export type AgentBlockType = z.infer<typeof AgentBlockTypeSchema>
export type AgentBlock = z.infer<typeof AgentBlockSchema>
export type AgentBlueprint = z.infer<typeof AgentBlueprintSchema>
