import { z } from "zod"

// ============================================================================
// VERSION & COMPATIBILITY
// ============================================================================

export const VERSION = "1.0.0"

export const VersionSchema = z.literal(VERSION)

// ============================================================================
// CORE IDENTIFIERS
// ============================================================================

export const IDSchema = z.string().min(1)

export const TimestampSchema = z.number().int().nonnegative()

// ============================================================================
// LAYER 1: RUNTIME - SEPARATED COMPONENTS
// ============================================================================

// ----------------------------------------------------------------------------
// Thought System
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Context System
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Tool System
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Agent Configuration
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Execution State (Runtime)
// ----------------------------------------------------------------------------

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

// ============================================================================
// LAYER 2: CHECKPOINT - MONOLITHIC EXPORT
// ============================================================================

export const CheckpointReasonSchema = z.enum([
  "step_complete",
  "manual",
  "low_confidence",
  "tool_error",
  "auto",
  "decision",
  "branch",
])

export const CheckpointMetadataSchema = z.object({
  step_number: z.number().int().nonnegative(),
  total_steps_estimate: z.number().int().positive().optional(),
  tokens_used: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  checkpoint_reason: CheckpointReasonSchema,
  agent_name: z.string().optional(),
  agent_id: IDSchema,
})

export const CheckpointParentSchema = z.object({
  checkpoint_id: IDSchema,
  is_branch: z.boolean().default(false),
  branch_reason: z.string().optional(),
})

export const CheckpointDiffSchema = z.object({
  from_checkpoint_id: IDSchema,
  changes: z.record(
    z.string(),
    z.object({
      before: z.any(),
      after: z.any(),
    }),
  ),
  summary: z.string(),
})

export const CheckpointSchema = z.object({
  version: VersionSchema,
  id: IDSchema,
  timestamp: TimestampSchema,
  execution_id: IDSchema,
  agent_id: IDSchema,

  // Monolithic snapshot
  snapshot: z.object({
    thought_chain: ThoughtChainSchema,
    context: ContextSchema,
    tool_state: ToolStateSchema,
    progress: ExecutionProgressSchema,
  }),

  // Metadata
  metadata: CheckpointMetadataSchema,

  // Optional: delta compression
  diff: CheckpointDiffSchema.optional(),

  // Optional: parent/branch info
  parent: CheckpointParentSchema.optional(),

  // Human-readable
  name: z.string().optional(),
  description: z.string().optional(),
})

// ============================================================================
// LAYER 3: DATABASE - NORMALIZED TABLES (Drizzle)
// ============================================================================

// Note: These are TypeScript types for Drizzle ORM, not Zod schemas
// They represent the database schema structure

export const DbCheckpointSchema = z.object({
  id: IDSchema,
  timestamp: TimestampSchema,
  execution_id: IDSchema,
  agent_id: IDSchema,

  // Full JSON for quick restore
  snapshot_json: z.string(),

  // Queryable metadata
  step_number: z.number().int().nonnegative(),
  tokens_used: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  checkpoint_reason: CheckpointReasonSchema,

  // Optional references
  parent_checkpoint_id: IDSchema.optional(),
  is_branch: z.boolean().default(false),
  branch_reason: z.string().optional(),

  // Human-readable
  name: z.string().optional(),
  description: z.string().optional(),
})

export const DbThoughtSchema = z.object({
  id: IDSchema,
  checkpoint_id: IDSchema,
  type: ThoughtTypeSchema,
  content: z.string(),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  parent_id: IDSchema.optional(),
  children_json: z.string(), // JSON array of IDs
  metadata_json: z.string().optional(),
  created_at: TimestampSchema,
})

export const DbToolCallSchema = z.object({
  id: IDSchema,
  checkpoint_id: IDSchema,
  tool_id: IDSchema,
  arguments_json: z.string(),
  result_json: z.string().optional(),
  success: z.boolean(),
  duration_ms: z.number().nonnegative(),
  timestamp: TimestampSchema,
})

export const DbExecutionSchema = z.object({
  id: IDSchema,
  agent_id: IDSchema,
  status: z.enum(["pending", "running", "paused", "completed", "failed", "cancelled"]),
  started_at: TimestampSchema,
  ended_at: TimestampSchema.optional(),
  current_checkpoint_id: IDSchema.optional(),
  total_tokens: z.number().int().nonnegative().default(0),
  metadata_json: z.string().optional(),
})

// ============================================================================
// PAUSE & INTERVENTION SYSTEM
// ============================================================================

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

// ============================================================================
// EVENT SYSTEM
// ============================================================================

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

// ============================================================================
// REASONING & EXPLAINABILITY
// ============================================================================

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

// ============================================================================
// AGENT BLUEPRINT (Visual Builder)
// ============================================================================

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

// ============================================================================
// GUI & VISUALIZATION
// ============================================================================

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

// ============================================================================
// API & COMMUNICATION
// ============================================================================

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

// ============================================================================
// MAIN FRAMEWORK SCHEMA
// ============================================================================

export const CAFSettingsSchema = z.object({
  // Checkpoint settings
  auto_checkpoint: z.boolean().default(true),
  checkpoint_on_decision: z.boolean().default(false),
  checkpoint_on_tool: z.boolean().default(false),
  max_checkpoints: z.number().int().positive().optional(),

  // Pause settings
  pause_on_low_confidence: z.boolean().default(false),
  confidence_threshold: z.number().default(0.6),
  max_intervention_timeout: z.number().default(3600000), // 1 hour

  // Tool settings
  require_approval_for_tools: z.array(z.string()).optional(),

  // Explanation settings
  explain_decisions: z.boolean().default(true),
  show_alternatives: z.boolean().default(true),
  show_confidence_factors: z.boolean().default(true),

  // GUI settings
  enable_gui: z.boolean().default(true),
  gui_port: z.number().int().positive().default(3001),
  websocket_port: z.number().int().positive().default(3002),
})

export const CAFSchema = z.object({
  version: VersionSchema,
  settings: CAFSettingsSchema,

  // Runtime data
  agents: z.record(IDSchema, AgentConfigSchema).optional(),
  executions: z.record(IDSchema, DbExecutionSchema).optional(),

  // Checkpoint data
  checkpoints: z.record(IDSchema, CheckpointSchema).optional(),

  // Intervention data
  pause_points: z.record(IDSchema, PausePointSchema).optional(),
  interventions: z.record(IDSchema, InterventionSchema).optional(),

  // Blueprint data
  blueprints: z.record(IDSchema, AgentBlueprintSchema).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ThoughtType = z.infer<typeof ThoughtTypeSchema>
export type ThoughtStep = z.infer<typeof ThoughtStepSchema>
export type ThoughtChain = z.infer<typeof ThoughtChainSchema>

export type MessageRole = z.infer<typeof MessageRoleSchema>
export type Message = z.infer<typeof MessageSchema>
export type Context = z.infer<typeof ContextSchema>

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>
export type ToolCall = z.infer<typeof ToolCallSchema>
export type ToolState = z.infer<typeof ToolStateSchema>

export type ModelConfig = z.infer<typeof ModelConfigSchema>
export type CheckpointConfig = z.infer<typeof CheckpointConfigSchema>
export type PauseConfig = z.infer<typeof PauseConfigSchema>
export type AgentConfig = z.infer<typeof AgentConfigSchema>

export type RuntimeState = z.infer<typeof RuntimeStateSchema>

export type CheckpointReason = z.infer<typeof CheckpointReasonSchema>
export type CheckpointMetadata = z.infer<typeof CheckpointMetadataSchema>
export type Checkpoint = z.infer<typeof CheckpointSchema>

export type PauseTrigger = z.infer<typeof PauseTriggerSchema>
export type PauseAction = z.infer<typeof PauseActionSchema>
export type PausePoint = z.infer<typeof PausePointSchema>
export type Intervention = z.infer<typeof InterventionSchema>

export type AgentEvent = z.infer<typeof AgentEventSchema>

export type ReasoningTrace = z.infer<typeof ReasoningTraceSchema>

export type AgentBlockType = z.infer<typeof AgentBlockTypeSchema>
export type AgentBlock = z.infer<typeof AgentBlockSchema>
export type AgentBlueprint = z.infer<typeof AgentBlueprintSchema>

export type CAFSettings = z.infer<typeof CAFSettingsSchema>
export type CAF = z.infer<typeof CAFSchema>

// Database types
export type DbCheckpoint = z.infer<typeof DbCheckpointSchema>
export type DbThought = z.infer<typeof DbThoughtSchema>
export type DbToolCall = z.infer<typeof DbToolCallSchema>
export type DbExecution = z.infer<typeof DbExecutionSchema>
