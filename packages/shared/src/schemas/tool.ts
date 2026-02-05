import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"

export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean(),
  description: z.string(),
  enum: z.array(z.any()).optional(),
  default: z.any().optional(),
})

export const ToolDefinitionSchema = z.object({
  id: IDSchema,
  name: z.string(),
  description: z.string(),
  category: z.string(),
  parameters: z.array(ToolParameterSchema),
  return_type: z.object({
    type: z.string(),
    schema: z.any().optional(),
  }),
  permissions: z.array(z.string()),
})

export const ToolCallSchema = z.object({
  id: IDSchema,
  tool_id: IDSchema,
  arguments: z.record(z.any()),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  result: z.any().optional(),
  error: z.string().optional(),
  duration_ms: z.number().nonnegative().optional(),
  timestamp: TimestampSchema,
})

export const ToolStateSchema = z.object({
  last_tool_call_id: IDSchema.optional(),
  pending: z.array(IDSchema),
  running: z.array(IDSchema),
  completed: z.array(ToolCallSchema),
  failed: z.array(ToolCallSchema),
})

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>
export type ToolCall = z.infer<typeof ToolCallSchema>
export type ToolState = z.infer<typeof ToolStateSchema>
