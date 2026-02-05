import type { CAFGraphState } from "../state"
import type { ThoughtChain, Context, ToolState } from "@liberos/caf-shared"
import { ThoughtChainSchema, ContextSchema, ToolStateSchema } from "@liberos/caf-shared"

export function createInitialState(task: string, context?: Partial<Context>): Partial<CAFGraphState> {
  const thought_chain: ThoughtChain = {
    current_step_id: undefined,
    steps: [],
  }
  const initialContext: Context = {
    messages: context?.messages ?? [],
    variables: context?.variables ?? { task },
    memory: context?.memory,
  }
  const tool_state: ToolState = {
    last_tool_call_id: undefined,
    pending: [],
    running: [],
    completed: [],
    failed: [],
  }
  ThoughtChainSchema.parse(thought_chain)
  ContextSchema.parse(initialContext)
  ToolStateSchema.parse(tool_state)

  return {
    task,
    thought_chain,
    context: initialContext,
    tool_state,
    progress: {
      step_number: 0,
      iterations_completed: 0,
      tokens_used: 0,
      duration_ms: 0,
    },
  }
}

export function entryNode(state: CAFGraphState): Partial<CAFGraphState> {
  return {
    ...createInitialState(state.task, state.context),
    progress: {
      ...state.progress,
      step_number: 0,
    },
  }
}
