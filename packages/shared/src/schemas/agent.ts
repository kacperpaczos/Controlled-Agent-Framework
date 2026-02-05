import { z } from "zod"
import { IDSchema } from "../core"
import { ThoughtChainSchema } from "./thought"
import { ContextSchema } from "./context"
import { ToolStateSchema } from "./tool"

export const ModelConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai", "google", "local"]),
  model_id: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
})

export const CheckpointConfigSchema = z.object({
  enabled: z.boolean().default(true),
  export_dir: z.string().default("./checkpoints"),
  auto_save: z.boolean().default(true),
  on_step_complete: z.boolean().default(false),
  on_tool_call: z.boolean().default(false),
  max_checkpoints: z.number().int().positive().optional(),
})

export const PauseConfigSchema = z.object({
  on_low_confidence: z.number().min(0).max(1).optional(),
  on_tool_error: z.boolean().default(false),
  manual: z.boolean().default(true),
  on_decision: z.boolean().default(false),
  custom_conditions: z.array(z.any()).optional(),
})

export const AgentConfigSchema = z.object({
  id: IDSchema.optional(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string(),
  model: ModelConfigSchema.optional(),
  tools: z.array(z.string()).optional(),
  checkpoints: CheckpointConfigSchema.optional(),
  pause: PauseConfigSchema.optional(),
  metadata: z.record(z.any()).optional(),
})

export const ExecutionProgressSchema = z.object({
  step_number: z.number().int().nonnegative(),
  total_steps_estimate: z.number().int().positive().optional(),
  iterations_completed: z.number().int().nonnegative(),
  tokens_used: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
})

export const RuntimeStateSchema = z.object({
  thought_chain: ThoughtChainSchema,
  context: ContextSchema,
  tool_state: ToolStateSchema,
  progress: ExecutionProgressSchema,
})

export type ModelConfig = z.infer<typeof ModelConfigSchema>
export type CheckpointConfig = z.infer<typeof CheckpointConfigSchema>
export type PauseConfig = z.infer<typeof PauseConfigSchema>
export type AgentConfig = z.infer<typeof AgentConfigSchema>
export type ExecutionProgress = z.infer<typeof ExecutionProgressSchema>
export type RuntimeState = z.infer<typeof RuntimeStateSchema>
