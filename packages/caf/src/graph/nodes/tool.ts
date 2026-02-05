import type { CAFGraphState } from "../state"

export function toolNode(state: CAFGraphState): Partial<CAFGraphState> {
  return {
    progress: {
      ...state.progress,
      step_number: state.progress.step_number + 1,
    },
  }
}
