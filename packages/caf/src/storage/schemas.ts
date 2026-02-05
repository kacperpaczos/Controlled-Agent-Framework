import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const checkpoints = sqliteTable("checkpoints", {
  id: text("id").primaryKey(),
  timestamp: integer("timestamp").notNull(),
  execution_id: text("execution_id").notNull(),
  agent_id: text("agent_id").notNull(),

  snapshot_json: text("snapshot_json").notNull(),

  step_number: integer("step_number").notNull(),
  tokens_used: integer("tokens_used").notNull(),
  duration_ms: integer("duration_ms").notNull(),
  checkpoint_reason: text("checkpoint_reason").notNull(),

  parent_checkpoint_id: text("parent_checkpoint_id"),
  is_branch: integer("is_branch", { mode: "boolean" }).default(false),
  branch_reason: text("branch_reason"),

  name: text("name"),
  description: text("description"),
})

export const thoughts = sqliteTable("thoughts", {
  id: text("id").primaryKey(),
  checkpoint_id: text("checkpoint_id")
    .notNull()
    .references(() => checkpoints.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  confidence: real("confidence"),
  parent_id: text("parent_id"),
  children_json: text("children_json"),
  metadata_json: text("metadata_json"),
  created_at: integer("created_at").notNull(),
})

export const toolCalls = sqliteTable("tool_calls", {
  id: text("id").primaryKey(),
  checkpoint_id: text("checkpoint_id")
    .notNull()
    .references(() => checkpoints.id),
  tool_id: text("tool_id").notNull(),
  arguments_json: text("arguments_json").notNull(),
  result_json: text("result_json"),
  success: integer("success", { mode: "boolean" }).notNull(),
  duration_ms: integer("duration_ms").notNull(),
  timestamp: integer("timestamp").notNull(),
})

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(),
  agent_id: text("agent_id").notNull(),
  status: text("status", {
    enum: ["pending", "running", "paused", "completed", "failed", "cancelled"],
  }).notNull(),
  started_at: integer("started_at").notNull(),
  ended_at: integer("ended_at"),
  current_checkpoint_id: text("current_checkpoint_id"),
  total_tokens: integer("total_tokens").notNull().default(0),
  metadata_json: text("metadata_json"),
})
