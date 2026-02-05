import { z } from "zod"
import { IDSchema, TimestampSchema } from "../core"
import { ThoughtStepSchema } from "./thought"
import { ToolCallSchema } from "./tool"
import { CheckpointSchema } from "./checkpoint"
import { PausePointSchema } from "./intervention"

export const AgentEventTypeSchema = z.enum([
  "agent.started",
  "agent.checkpoint",
  "agent.paused",
  "agent.resumed",
  "agent.completed",
  "agent.failed",
  "agent.cancelled",
  "thought.created",
  "thought.updated",
  "tool.called",
  "tool.completed",
  "tool.failed",
  "context.updated",
  "error.occurred",
])

export const AgentEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent.started"),
    execution_id: IDSchema,
    agent_id: IDSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("agent.checkpoint"),
    execution_id: IDSchema,
    checkpoint: CheckpointSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("agent.paused"),
    execution_id: IDSchema,
    pause_point: PausePointSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("agent.resumed"),
    execution_id: IDSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("agent.completed"),
    execution_id: IDSchema,
    result: z.any(),
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("thought.created"),
    execution_id: IDSchema,
    thought: ThoughtStepSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("tool.called"),
    execution_id: IDSchema,
    tool_call: ToolCallSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("tool.completed"),
    execution_id: IDSchema,
    tool_call: ToolCallSchema,
    timestamp: TimestampSchema,
  }),
  z.object({
    type: z.literal("error.occurred"),
    execution_id: IDSchema,
    error: z.object({
      message: z.string(),
      stack: z.string().optional(),
      code: z.string().optional(),
    }),
    timestamp: TimestampSchema,
  }),
])

export type AgentEvent = z.infer<typeof AgentEventSchema>
