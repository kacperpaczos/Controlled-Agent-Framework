import { z } from "zod"
import { IDSchema, VersionSchema } from "../core"
import { AgentConfigSchema } from "./agent"
import { CheckpointSchema } from "./checkpoint"
import { DbExecutionSchema } from "./db"
import { PausePointSchema, InterventionSchema } from "./intervention"
import { AgentBlueprintSchema } from "./blueprint"

export const CAFSettingsSchema = z.object({
  auto_checkpoint: z.boolean().default(true),
  checkpoint_on_decision: z.boolean().default(false),
  checkpoint_on_tool: z.boolean().default(false),
  max_checkpoints: z.number().int().positive().optional(),

  pause_on_low_confidence: z.boolean().default(false),
  confidence_threshold: z.number().default(0.6),
  max_intervention_timeout: z.number().default(3600000),

  require_approval_for_tools: z.array(z.string()).optional(),

  explain_decisions: z.boolean().default(true),
  show_alternatives: z.boolean().default(true),
  show_confidence_factors: z.boolean().default(true),

  enable_gui: z.boolean().default(true),
  gui_port: z.number().int().positive().default(3001),
  websocket_port: z.number().int().positive().default(3002),
})

export const CAFSchema = z.object({
  version: VersionSchema,
  settings: CAFSettingsSchema,

  agents: z.record(IDSchema, AgentConfigSchema).optional(),
  executions: z.record(IDSchema, DbExecutionSchema).optional(),

  checkpoints: z.record(IDSchema, CheckpointSchema).optional(),

  pause_points: z.record(IDSchema, PausePointSchema).optional(),
  interventions: z.record(IDSchema, InterventionSchema).optional(),

  blueprints: z.record(IDSchema, AgentBlueprintSchema).optional(),
})

export type CAFSettings = z.infer<typeof CAFSettingsSchema>
export type CAF = z.infer<typeof CAFSchema>
