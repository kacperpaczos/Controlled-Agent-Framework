import type { ThoughtChain, Context, ToolState } from "@liberos/caf-shared"
import type { ExecutionProgress } from "@liberos/caf-shared"

export interface CAFGraphState {
  task: string
  thought_chain: ThoughtChain
  context: Context
  tool_state: ToolState
  progress: ExecutionProgress
  result?: unknown
}

export interface CAFGraphInput {
  task: string
  context?: Partial<Context>
}
