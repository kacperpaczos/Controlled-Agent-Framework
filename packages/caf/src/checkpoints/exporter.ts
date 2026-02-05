import type { Checkpoint, CheckpointMetadata } from "@liberos/caf-shared"
import { CheckpointSchema, VERSION } from "@liberos/caf-shared"
import type { RuntimeState as RuntimeStateClass } from "../runtime/state"
import { generateId } from "../utils/id"
import * as fs from "fs"
import * as path from "path"

export class CheckpointExporter {
  constructor(
    private executionId: string,
    private agentId: string,
    private exportDir: string
  ) {}

  async exportToFile(
    state: RuntimeStateClass,
    metadata: Omit<CheckpointMetadata, "agent_id">
  ): Promise<Checkpoint> {
    const snapshot = state.toJSON()
    const checkpoint: Checkpoint = {
      version: VERSION as "0.0.1",
      id: generateId(),
      timestamp: Date.now(),
      execution_id: this.executionId,
      agent_id: this.agentId,
      snapshot: {
        thought_chain: snapshot.thought_chain,
        context: snapshot.context,
        tool_state: snapshot.tool_state,
        progress: snapshot.progress,
      },
      metadata: {
        ...metadata,
        agent_id: this.agentId,
      },
    }

    CheckpointSchema.parse(checkpoint)

    const dir = path.resolve(this.exportDir)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const filePath = path.join(dir, `${checkpoint.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), "utf-8")

    return checkpoint
  }
}
