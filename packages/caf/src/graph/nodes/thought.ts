import type { CAFGraphState } from "../state"
import type { ThoughtStep } from "@liberos/caf-shared"

function generateId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function thoughtNode(state: CAFGraphState): Partial<CAFGraphState> {
  const newStep: ThoughtStep = {
    id: generateId(),
    type: "reasoning",
    content: `Processing task: ${state.task}`,
    confidence: 0.9,
    children: [],
    timestamp: Date.now(),
  }

  const steps = [...state.thought_chain.steps, newStep]
  const thought_chain = {
    ...state.thought_chain,
    current_step_id: newStep.id,
    steps,
  }

  return {
    thought_chain,
    progress: {
      ...state.progress,
      step_number: state.progress.step_number + 1,
      iterations_completed: state.progress.iterations_completed + 1,
    },
  }
}
