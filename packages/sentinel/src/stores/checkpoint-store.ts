import { create } from "zustand"
import type { Checkpoint } from "@liberos/caf-shared"

interface CheckpointStore {
  checkpoints: Record<string, Checkpoint>
  updateCheckpoint: (checkpoint: Checkpoint) => void
}

export const useCheckpointStore = create<CheckpointStore>((set) => ({
  checkpoints: {},
  updateCheckpoint: (checkpoint) =>
    set((state) => ({
      checkpoints: { ...state.checkpoints, [checkpoint.id]: checkpoint },
    })),
}))
