# CAF - Wprowadzenie

## Instalacja

```bash
npm install @liberos/caf
# opcjonalnie: drizzle-orm better-sqlite3 (dla SQLite)
```

## Minimalny przykład

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "my-agent",
  instructions: "You are a helpful assistant.",
  checkpoints: { enabled: true },
})

const result = await agent.run("Hello!")
console.log(result)
```

## Checkpointy

Checkpointy zapisują stan agenta (thought chain, context, tool state) jako czytelne pliki JSON w `./checkpoints/` (domyślnie).

```typescript
agent.on("agent.checkpoint", (e) => console.log("Checkpoint:", e.checkpoint.id))

const cp = await agent.exportCheckpoint(checkpointId)
await agent.restoreCheckpoint(cp)
// następne run() może użyć options.resumeFrom = cp.id
```

## Human-in-the-loop

Włącz pauzowanie i reaguj na zdarzenie `agent.paused`:

```typescript
const agent = new AgentEngine({
  name: "hitl",
  instructions: "...",
  pause: { manual: true, on_tool_error: true },
})

agent.on("agent.paused", async (e) => {
  const pausePoint = e.pause_point
  // Pokaż użytkownikowi pausePoint.available_actions
  // Po decyzji: wywołaj API resume (implementacja zależy od warstwy transportu)
})
```

## GUI (Sentinel)

Opcjonalnie uruchom GUI deweloperskie:

```bash
npx @liberos/sentinel
# lub z monorepo: cd packages/sentinel && npm run dev
```

Połącz z CAF Dev Server (WebSocket), aby podglądać wykonywanie w czasie rzeczywistym.
