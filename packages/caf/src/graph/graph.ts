import type { AgentConfig } from "@liberos/caf-shared"
import type { CAFGraphState, CAFGraphInput } from "./state"
import { entryNode, thoughtNode, toolNode, reflectionNode, exitNode } from "./nodes"
import { createInitialState } from "./nodes/entry"

export interface CAFGraphInvokeResult {
  thought_chain: CAFGraphState["thought_chain"]
  context: CAFGraphState["context"]
  tool_state: CAFGraphState["tool_state"]
  progress: CAFGraphState["progress"]
  result?: unknown
}

export class CAFGraph {
  private config: AgentConfig
  private checkpointer: Map<string, CAFGraphState> = new Map()

  constructor(config: AgentConfig) {
    this.config = config
  }

  async invoke(
    input: CAFGraphInput,
    runConfig?: RunnableConfig
  ): Promise<CAFGraphInvokeResult> {
    const threadId = (runConfig?.configurable?.thread_id as string) ?? `thread_${Date.now()}`
    const checkpointId = runConfig?.configurable?.checkpoint_id as string | undefined

    let state: CAFGraphState

    if (checkpointId && this.checkpointer.has(checkpointId)) {
      state = this.checkpointer.get(checkpointId)!
    } else {
      const initial = createInitialState(input.task, input.context)
      state = {
        task: input.task,
        thought_chain: initial.thought_chain!,
        context: initial.context!,
        tool_state: initial.tool_state!,
        progress: initial.progress!,
      }
    }

    const maxSteps = 10
    for (let i = 0; i < maxSteps; i++) {
      const entryUpdate = entryNode(state)
      state = { ...state, ...entryUpdate } as CAFGraphState

      const thoughtUpdate = thoughtNode(state)
      state = { ...state, ...thoughtUpdate } as CAFGraphState

      const toolUpdate = toolNode(state)
      state = { ...state, ...toolUpdate } as CAFGraphState

      const reflectionUpdate = reflectionNode(state)
      state = { ...state, ...reflectionUpdate } as CAFGraphState

      const exitUpdate = exitNode(state)
      state = { ...state, ...exitUpdate } as CAFGraphState

      this.checkpointer.set(`step_${state.progress.step_number}`, state)

      if (state.result !== undefined) {
        return {
          thought_chain: state.thought_chain,
          context: state.context,
          tool_state: state.tool_state,
          progress: state.progress,
          result: state.result,
        }
      }
    }

    return {
      thought_chain: state.thought_chain,
      context: state.context,
      tool_state: state.tool_state,
      progress: state.progress,
      result: state.result,
    }
  }

  getCheckpointer(): Map<string, CAFGraphState> {
    return this.checkpointer
  }
}

export interface RunnableConfig {
  configurable?: {
    thread_id?: string
    checkpoint_id?: string
  }
}
