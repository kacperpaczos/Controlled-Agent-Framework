# CAF – Controlled Agent Framework

SDK-first biblioteka do tworzenia AI agentów z zaawansowaną obserwowalnością i human-in-the-loop.

## Pakiety

- **@liberos/caf** – SDK (silnik agenta, checkpointy, narzędzia, event bus, MCP, CLI)
- **@liberos/caf-shared** – współdzielone typy i schematy Zod
- **@liberos/sentinel** – opcjonalne GUI deweloperskie (Next.js/React)

## Szybki start

```bash
# Z monorepo
cd packages/caf && npm run build
node dist/cli.js --help

# Uruchom agenta (przykład)
cd examples/basic-agent && npm install && npm start
```

## API

```typescript
import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "my-agent",
  instructions: "You are a helpful assistant.",
  checkpoints: { enabled: true },
})

agent.on("checkpoint", (e) => console.log("Checkpoint:", e.checkpoint.id))
const result = await agent.run("Hello!")
await agent.exportCheckpoint(id)
await agent.restoreCheckpoint(checkpoint)
```

## CLI

- `npx caf dev` – serwer deweloperski (HTTP API)
- `npx caf mcp` – serwer MCP dla integracji z IDE (Cursor, VSCode)

## GUI (Sentinel)

```bash
cd packages/sentinel && npm run dev
```

Otwórz http://localhost:3001. Połącz z CAF Dev Server (WebSocket), aby podglądać wykonywanie w czasie rzeczywistym.

## Dokumentacja

- [getting-started](docs/getting-started.md)
- [api-reference](docs/api-reference.md)
- [checkpoint-system](docs/checkpoint-system.md)
- [intervention](docs/intervention.md)

## Wersja schematu

`VERSION = "0.0.1"` (w @liberos/caf-shared). Pola w snake_case, struktury w Zod.
