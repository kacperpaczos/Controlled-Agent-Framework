import { create } from "zustand"
import type { DbExecution } from "@liberos/caf-shared"

interface ExecutionStore {
  executions: Record<string, DbExecution>
  currentExecutionId: string | null
  addExecution: (execution: DbExecution) => void
  setCurrentExecution: (id: string | null) => void
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  executions: {},
  currentExecutionId: null,
  addExecution: (execution) =>
    set((state) => ({
      executions: { ...state.executions, [execution.id]: execution },
    })),
  setCurrentExecution: (id) => set({ currentExecutionId: id }),
}))
