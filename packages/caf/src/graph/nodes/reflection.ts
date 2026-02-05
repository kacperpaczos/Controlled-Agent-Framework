import type { CAFGraphState } from "../state"

export function reflectionNode(state: CAFGraphState): Partial<CAFGraphState> {
  return {
    progress: {
      ...state.progress,
      step_number: state.progress.step_number + 1,
    },
  }
}
