# API Reference

## AgentEngine

### constructor(config: AgentConfig)

Tworzy instancję agenta. `config` jest walidowany przez Zod (AgentConfigSchema).

### run(task: string, options?: RunOptions): Promise\<unknown\>

Uruchamia agenta z zadaniem `task`. Opcje:

- `resumeFrom?: string` – ID checkpointu, od którego wznowić
- `onCheckpoint?: (checkpoint) => void` – callback przy każdym checkpoincie
- `onPause?: (pausePoint) => void` – callback przy pauzie

### on(eventType, listener): this

Rejestruje nasłuchiwacz zdarzeń. Typy: `agent.started`, `agent.checkpoint`, `agent.paused`, `agent.resumed`, `agent.completed`, `thought.created`, `tool.called`, `tool.completed`, `error.occurred`.

### exportCheckpoint(checkpointId: string): Promise\<Checkpoint\>

Eksportuje checkpoint po ID (z pliku lub bazy).

### restoreCheckpoint(checkpoint: Checkpoint): Promise\<void\>

Przywraca checkpoint jako punkt startowy następnego `run()`. Aby faktycznie wznowić, wywołaj `run(task, { resumeFrom: checkpoint.id })`.

### setDatabase(db): void

Opcjonalnie ustawia instancję Drizzle (SQLite) do zapisu checkpointów w bazie.

## ToolRegistry

### register(tool): void

Rejestruje narzędzie (ToolDefinition z metodą `execute`).

### execute(toolId, args): Promise\<{ success, result?, error? }\>

Wykonuje narzędzie po ID z podanymi argumentami.

## PromptCompiler

### compile(template: string, context: Context): string

Zastępuje w szablonie zmienne `{{name}}` wartościami z `context.variables` i uruchamia zarejestrowane hooki.

### registerHook(hook: PromptHook): void

Dodaje hook transformujący skompilowany prompt.
