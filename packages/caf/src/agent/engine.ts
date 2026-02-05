import type { AgentConfig, AgentEvent, Checkpoint } from "@liberos/caf-shared"
import { AgentConfigSchema } from "@liberos/caf-shared"
import { CAFGraph } from "../graph/graph"
import { RuntimeState } from "../runtime/state"
import { CheckpointManager } from "../checkpoints/manager"
import { CAFEventBus } from "../events/emitter"
import { ToolRegistry } from "../tools/registry"
import { PromptCompiler } from "../prompts/compiler"
import { builtinTools } from "../tools/builtin"
import { generateId } from "../utils/id"

export interface RunOptions {
  resumeFrom?: string
  onCheckpoint?: (checkpoint: Checkpoint) => void
  onPause?: (pausePoint: { resume: () => Promise<void>; reason: string }) => void | Promise<void>
}

export class AgentEngine {
  private config: AgentConfig
  private eventBus: CAFEventBus
  private toolRegistry: ToolRegistry
  private promptCompiler: PromptCompiler
  private exportDir: string
  private db: unknown | null
  private restoredCheckpointId: string | null = null

  constructor(config: AgentConfig) {
    this.config = AgentConfigSchema.parse(config)
    this.eventBus = new CAFEventBus()
    this.toolRegistry = new ToolRegistry()
    this.promptCompiler = new PromptCompiler()
    this.exportDir = this.config.checkpoints?.export_dir ?? "./checkpoints"
    this.db = null
    this.registerBuiltinTools()
  }

  setDatabase(db: unknown): void {
    this.db = db
  }

  private registerBuiltinTools(): void {
    for (const tool of builtinTools) {
      this.toolRegistry.register(tool as import("../tools/registry").ExecutableTool)
    }
  }

  async run(task: string, options?: RunOptions): Promise<unknown> {
    const executionId = generateId()
    const agentId = this.config.id ?? this.config.name
    let stepNumber = 0
    let tokensUsed = 0
    const startTime = Date.now()

    const checkpointManager = new CheckpointManager({
      db: this.db,
      exportDir: this.exportDir,
      executionId,
      agentId,
      getStepNumber: () => stepNumber,
      getTokensUsed: () => tokensUsed,
      getStartTime: () => startTime,
    })

    this.eventBus.emitEvent({
      type: "agent.started",
      execution_id: executionId,
      agent_id: agentId,
      timestamp: Date.now(),
    })

    let input: import("../graph/state").CAFGraphInput = { task }
    const resumeFrom = options?.resumeFrom ?? this.restoredCheckpointId
    if (resumeFrom && this.config.checkpoints?.enabled) {
      try {
        const state = await checkpointManager.restore(resumeFrom)
        input = {
          task,
          context: {
            messages: state.context.messages,
            variables: { ...state.context.variables, task } as Record<string, unknown>,
          },
        }
      } catch {
        // ignore restore failure, start fresh
      }
    }

    const graph = new CAFGraph(this.config)
    const runConfig: import("../graph/graph").RunnableConfig = {
      configurable: {
        thread_id: executionId,
        checkpoint_id: resumeFrom ?? undefined,
      },
    }

    try {
      const result = await graph.invoke(input, runConfig)
      stepNumber = result.progress.step_number
      tokensUsed = result.progress.tokens_used

      if (this.config.checkpoints?.enabled && result.result !== undefined) {
        const runtimeState = new RuntimeState({
          thought_chain: result.thought_chain,
          context: result.context,
          tool_state: result.tool_state,
          progress: result.progress,
        })
        const checkpoint = await checkpointManager.save(runtimeState, "step_complete")
        this.eventBus.emitEvent({
          type: "agent.checkpoint",
          execution_id: executionId,
          checkpoint,
          timestamp: Date.now(),
        })
        options?.onCheckpoint?.(checkpoint)
      }

      this.eventBus.emitEvent({
        type: "agent.completed",
        execution_id: executionId,
        result: result.result,
        timestamp: Date.now(),
      })

      return result.result
    } catch (error) {
      this.eventBus.emitEvent({
        type: "error.occurred",
        execution_id: executionId,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        timestamp: Date.now(),
      })
      throw error
    }
  }

  on<T extends AgentEvent["type"]>(
    eventType: T,
    listener: (event: Extract<AgentEvent, { type: T }>) => void
  ): this {
    this.eventBus.on(eventType, listener)
    return this
  }

  async exportCheckpoint(checkpointId: string): Promise<Checkpoint> {
    const manager = new CheckpointManager({
      db: this.db,
      exportDir: this.exportDir,
      executionId: "export",
      agentId: this.config.id ?? this.config.name,
      getStepNumber: () => 0,
      getTokensUsed: () => 0,
      getStartTime: () => Date.now(),
    })
    return manager.export(checkpointId)
  }

  async restoreCheckpoint(checkpoint: Checkpoint): Promise<void> {
    this.restoredCheckpointId = checkpoint.id
  }
}
