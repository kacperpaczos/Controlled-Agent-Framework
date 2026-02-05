import type { PausePoint, PauseTrigger } from "@liberos/caf-shared"
import { generateId } from "../utils/id"
import type { Checkpoint } from "@liberos/caf-shared"
import type { CAFEventBus } from "../events/emitter"

export interface PausePointManagerDeps {
  eventBus: CAFEventBus
  executionId: string
  getCurrentCheckpoint: () => Promise<Checkpoint | null>
}

export class PausePointManager {
  private eventBus: CAFEventBus
  private executionId: string
  private getCurrentCheckpoint: () => Promise<Checkpoint | null>
  private interventionResolvers = new Map<string, { resolve: () => void; reject: (err: Error) => void }>()

  constructor(deps: PausePointManagerDeps) {
    this.eventBus = deps.eventBus
    this.executionId = deps.executionId
    this.getCurrentCheckpoint = deps.getCurrentCheckpoint
  }

  async createPausePoint(reason: PauseTrigger, triggerDetails: Record<string, unknown>): Promise<PausePoint> {
    const checkpoint = await this.getCurrentCheckpoint()
    const checkpointId = checkpoint?.id ?? "none"

    const pausePoint: PausePoint = {
      id: generateId(),
      execution_id: this.executionId,
      checkpoint_id: checkpointId,
      trigger: reason,
      trigger_details: triggerDetails,
      status_summary: `Paused: ${reason}`,
      pending_questions: [],
      available_actions: [
        { id: "continue", label: "Continue", description: "Resume execution", type: "continue" },
        { id: "cancel", label: "Cancel", description: "Cancel execution", type: "cancel" },
      ],
      created_at: Date.now(),
    }

    this.eventBus.emitEvent({
      type: "agent.paused",
      execution_id: this.executionId,
      pause_point: pausePoint,
      timestamp: Date.now(),
    })

    return pausePoint
  }

  waitForIntervention(pausePointId: string, timeoutMs?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.interventionResolvers.delete(pausePointId)
        reject(new Error("Intervention timeout"))
      }, timeoutMs ?? 3600000)

      this.interventionResolvers.set(pausePointId, {
        resolve: () => {
          clearTimeout(t)
          this.interventionResolvers.delete(pausePointId)
          resolve()
        },
        reject: (err) => {
          clearTimeout(t)
          this.interventionResolvers.delete(pausePointId)
          reject(err)
        },
      })
    })
  }

  resolveIntervention(pausePointId: string): void {
    this.interventionResolvers.get(pausePointId)?.resolve()
  }

  rejectIntervention(pausePointId: string, error: Error): void {
    this.interventionResolvers.get(pausePointId)?.reject(error)
  }
}
