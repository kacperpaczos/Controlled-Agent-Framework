import { EventEmitter } from "events"
import type { AgentEvent } from "@liberos/caf-shared"
import { AgentEventSchema } from "@liberos/caf-shared"

export class CAFEventBus extends EventEmitter {
  emitEvent(event: AgentEvent): boolean {
    const validated = AgentEventSchema.parse(event)
    this.emit(validated.type, validated)
    this.emit("event", validated)
    return true
  }

  on<T extends AgentEvent["type"]>(
    eventType: T,
    listener: (event: Extract<AgentEvent, { type: T }>) => void
  ): this {
    return super.on(eventType, listener as (event: AgentEvent) => void)
  }
}
