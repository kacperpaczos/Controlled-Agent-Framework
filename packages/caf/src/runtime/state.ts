import type { ThoughtChain, Context, ToolState, ExecutionProgress, Checkpoint } from "@liberos/caf-shared"
import { ThoughtChainSchema, ContextSchema, ToolStateSchema, ExecutionProgressSchema } from "@liberos/caf-shared"

export class RuntimeState {
  thought_chain: ThoughtChain
  context: Context
  tool_state: ToolState
  progress: ExecutionProgress

  constructor(init?: Partial<{
    thought_chain: ThoughtChain
    context: Context
    tool_state: ToolState
    progress: ExecutionProgress
  }>) {
    this.thought_chain = init?.thought_chain ?? { steps: [] }
    this.context = init?.context ?? { messages: [], variables: {} }
    this.tool_state = init?.tool_state ?? { pending: [], running: [], completed: [], failed: [] }
    this.progress = init?.progress ?? {
      step_number: 0,
      iterations_completed: 0,
      tokens_used: 0,
      duration_ms: 0,
    }
  }

  updateContext(update: Partial<Context>): void {
    this.context = { ...this.context, ...update }
  }

  toJSON(): {
    thought_chain: ThoughtChain
    context: Context
    tool_state: ToolState
    progress: ExecutionProgress
  } {
    return {
      thought_chain: this.thought_chain,
      context: this.context,
      tool_state: this.tool_state,
      progress: this.progress,
    }
  }

  static fromCheckpoint(checkpoint: Checkpoint): RuntimeState {
    const snapshot = checkpoint.snapshot
    return new RuntimeState({
      thought_chain: snapshot.thought_chain,
      context: snapshot.context,
      tool_state: snapshot.tool_state,
      progress: snapshot.progress,
    })
  }

  static fromJSON(json: {
    thought_chain: ThoughtChain
    context: Context
    tool_state: ToolState
    progress: ExecutionProgress
  }): RuntimeState {
    ThoughtChainSchema.parse(json.thought_chain)
    ContextSchema.parse(json.context)
    ToolStateSchema.parse(json.tool_state)
    ExecutionProgressSchema.parse(json.progress)
    return new RuntimeState(json)
  }
}
