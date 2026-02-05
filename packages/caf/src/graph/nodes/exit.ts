import type { CAFGraphState } from "../state"

export function exitNode(state: CAFGraphState): Partial<CAFGraphState> {
  return {
    result: {
      task: state.task,
      steps: state.progress.step_number,
      thought_count: state.thought_chain.steps.length,
    },
  }
}
