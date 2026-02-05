import { z } from "zod"
import { TimestampSchema } from "../core"

export const MessageRoleSchema = z.enum(["user", "assistant", "system", "tool"])

export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  tool_calls: z.any().optional(),
  tool_results: z.any().optional(),
  timestamp: TimestampSchema.optional(),
})

export const MemoryEntrySchema = z.object({
  key: z.string(),
  value: z.any(),
  importance: z.number().min(0).max(1),
  timestamp: TimestampSchema,
})

export const ContextSchema = z.object({
  messages: z.array(MessageSchema),
  variables: z.record(z.string(), z.any()),
  memory: z.array(MemoryEntrySchema).optional(),
})

export type MessageRole = z.infer<typeof MessageRoleSchema>
export type Message = z.infer<typeof MessageSchema>
export type Context = z.infer<typeof ContextSchema>
