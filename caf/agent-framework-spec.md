# CAF - Controlled Agent Framework

## Nazewnictwo

- **Organizacja**: `@liberos`
- **SDK**: `caf` (@liberos/caf) - Controlled Agent Framework
- **GUI**: `sentinel` (@liberos/sentinel) - Watcher/Observer tool

## Philosophy: SDK First

**Biblioteka/SDK jest głównym produktem.** GUI jest opcjonalnym narzędziem deweloperskim, nie wymaganym do działania frameworka.

### Zasady SDK First:

1. **SDK działa standalone** - może być używane bez GUI (programmatic, MCP)
2. **GUI jest separowalny** - osobny pakiet, opcjonalna instalacja
3. **Komunikacja jest opcjonalna** - SDK nie wymaga WebSocket/HTTP dla podstawowej funkcjonalności
4. **Public API jest stabilne** - GUI używa tylko public API, nie internalów
5. **Minimalne dependencies** - SDK ma tylko niezbędne peer dependencies

---

## Wymagania Funkcjonalne

### 1. Architektura

- **Framework do pisania AI agentów**
- **Dostarczany jako SDK/biblioteka** - podstawowa forma dystrybucji
- **MCP server jako adapter** - opcjonalny wrapper dla IDE integration
- **GUI jako dev tool** - opcjonalne narzędzie deweloperskie
- Tylko JS/TS (Bun lub Node.js)

### 2. SDK Core Functionality

- Tworzenie/edytowanie pętli agenta (programmatic API)
- Praca z narzędziami (tool registry)
- Dostrajanie modeli
- Dynamiczne składanie promptów na podstawie kontekstu
- **Eksportowalność** - checkpointy, execution traces jako pliki

### 3. Kontrola i Obserwowalność (SDK Level)

- Kontrola procesu myślenia agenta (callbacks, hooks)
- Pełna obserwacja procesu wykonania (event emitters)
- System checkpoint/snapshots (file-based + opcjonalnie DB)
- Pauzowanie workflow (async/await, generators)
- Wznawianie od stanu X (checkpoint restore)

### 4. Human-in-the-Loop (SDK Level)

- Programmatic intervention API (async pause/resume)
- System wyjaśnień/uzasadnień decyzji (reasoning traces)
- Event system dla external handlers
- **GUI integration** - opcjonalne, przez event bus

### 5. Dev GUI (Optional Package)

- **Nie jest wymagana do działania SDK**
- Wykorzystuje public SDK API (events, checkpoints, exports)
- Może być uruchamiana osobno i łączyć się z działającym SDK
- Next.js + React (standalone application)
- Podgląd struktur danych
- Podgląd powiązań między elementami
- Edycja stanu runtime (przez SDK API)
- Sesje interwencji użytkownika

### 6. Prompt Engineering

- Baza struktur promptów (system, agent, instruction)
- Walidacja struktur
- Dynamiczne szablony
- Plugin hooks
- Export/import konfiguracji jako pliki

### 7. Rozszerzalność

- Możliwość pisania własnych rozszerzeń
- Elastyczna architektura SDK
- Plugin system (hooks, middleware)
- Custom storage backends

---

## Stack Technologiczny

### SDK Core (Required)

```
Runtime:        Bun (development), Node.js (production)
Graph Engine:   LangGraph.js (core logic)
Storage:        SQLite + Drizzle ORM (peer dependency)
                OR File-based storage (zero-config default)
LLM Providers:  @anthropic-ai/sdk, openai (peer dependency)
Protocol:       MCP (opcjonalny adapter w SDK)
```

### GUI (Optional Dev Tool)

```
Framework:      Next.js 14 (standalone application)
UI Library:     React 18
Styling:        Tailwind CSS
State:          Zustand
Charts:         D3.js / React Flow
Communication:  WebSocket (opcjonalne, dołącza się do SDK)
```

---

## Architektura Systemu

### SDK-First Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SDK CORE (Standalone Library)                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │  Agent      │  │  Checkpoints│  │  Tool Registry     │  │  │
│  │  │  Engine     │  │  (Export/   │  │                    │  │  │
│  │  │             │  │   Import)   │  │                    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  │         │                 │                 │                │  │
│  │         ▼                 ▼                 ▼                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │  Prompt     │  │  Event Bus  │  │  Reasoning         │  │  │
│  │  │  Compiler   │  │  (Public)   │  │  Chain             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  PUBLIC API:                                                        │
│  - const agent = new AgentFramework(config)                        │
│  - agent.on('checkpoint', handler)                                 │
│  - agent.on('pause', handler)                                      │
│  - await agent.run(task, { onCheckpoint, onPause })               │
│  - await agent.exportCheckpoint(id)                                │
│  - await agent.restoreCheckpoint(data)                             │
│                                                                     │
│  PEER DEPS: drizzle-orm, better-sqlite3, @anthropic-ai/sdk         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ OPTIONAL ADAPTERS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OPTIONAL: MCP SERVER (Adapter)                                    │
│  - Wraps SDK for IDE integration                                   │
│  - STDIN/STDOUT JSON-RPC protocol                                  │
│  - No GUI required                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ OPTIONAL VISUALIZATION
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OPTIONAL: DEV GUI (Standalone Next.js App)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Connects to SDK via:                                         │  │
│  │  - WebSocket (real-time events)                              │  │
│  │  - HTTP API (checkpoints, exports)                           │  │
│  │  - File watching (export/import)                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Features:                                                          │
│  - Visual Agent Builder                                            │
│  - Execution Monitor (real-time)                                   │
│  - Checkpoint Inspector                                            │
│  - Thought Chain Visualization                                     │
│  - Intervention Panel                                              │
│                                                                     │
│  Installation: npm install -D @liberos/sentinel                 │
│  Usage: npx @liberos/caf gui --connect ./agent.config.ts        │
└─────────────────────────────────────────────────────────────────────┘
```

### Przepływ Danych

```
USER CODE (SDK)
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  AgentFramework.run(task, options)                             │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │  1. Initialize (config, state, checkpoints)             │ │
│    │  2. Event emission (checkpoint, pause, thought)        │ │
│    │  3. File export (optional checkpoint.json files)       │ │
│    │  4. Callback execution (onCheckpoint, onPause)         │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
      │
      ├──► FILE SYSTEM (checkpoints/*.json)
      │
      ├──► EVENTS (for GUI connection)
      │
      └──► CALLBACKS (user code)

GUI (Optional, started separately)
      │
      ├──► Watches files (checkpoints/*.json)
      ├──► Connects WebSocket (real-time events)
      └──► HTTP API (export/import)
```

---

## Struktury Danych

### Core SDK Types

```typescript
// Agent Configuration
interface AgentConfig {
  name: string
  instructions: string
  tools?: string[]
  model?: ModelConfig
  checkpoints?: {
    enabled: boolean
    exportDir?: string // Default: './checkpoints'
    autoSave?: boolean // Auto-save on every step
  }
  pause?: {
    onLowConfidence?: number // Threshold 0-1
    onToolError?: boolean
    manual?: boolean // Allow manual pause
  }
}

// Checkpoint (Exportable)
interface Checkpoint {
  id: string
  timestamp: number
  executionID: string

  state: {
    thoughtChain: ThoughtChain
    context: Context
    toolState: ToolState
  }

  metadata: {
    stepNumber: number
    tokensUsed: number
    duration: number
  }
}

// Thought Chain
interface ThoughtChain {
  currentStepID?: string
  steps: ThoughtStep[]
}

interface ThoughtStep {
  id: string
  type: "planning" | "reasoning" | "tool_selection" | "tool_execution" | "reflection"
  content: string
  reasoning?: string
  confidence: number
  parentID?: string
  children: string[]
  timestamp: number
}

// Event Types (Public API)
type AgentEvent =
  | { type: "agent.started"; executionID: string }
  | { type: "agent.checkpoint"; checkpoint: Checkpoint }
  | { type: "agent.paused"; pausePoint: PausePoint }
  | { type: "agent.resumed"; executionID: string }
  | { type: "agent.completed"; result: any }
  | { type: "thought.created"; thought: ThoughtStep }
  | { type: "tool.called"; toolID: string; args: any }
  | { type: "tool.completed"; toolID: string; result: any }

// Pause Point (Programmatic Intervention)
interface PausePoint {
  id: string
  executionID: string
  checkpointID: string
  reason: "low_confidence" | "tool_error" | "manual" | "condition"
  context: any

  // Actions available
  resume(): Promise<void>
  modify(updates: Partial<State>): Promise<void>
  cancel(): Promise<void>
}
```

---

## Struktura Projektu (Monorepo)

```
caf/
├── package.json                    # Root workspace config
├── tsconfig.json                   # Root TypeScript
├── turbo.json                      # Turborepo
│
├── packages/
│   │
│   ├── sdk/                        # 📦 SDK CORE (Required)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts            # Public API exports
│   │   │   │
│   │   │   ├── agent/
│   │   │   │   ├── engine.ts       # Main AgentFramework class
│   │   │   │   ├── loop.ts         # Execution loop
│   │   │   │   ├── state.ts        # State management
│   │   │   │   └── types.ts        # Core types
│   │   │   │
│   │   │   ├── checkpoints/        # Checkpoint system
│   │   │   │   ├── manager.ts      # Checkpoint manager
│   │   │   │   ├── exporter.ts     # Export to file
│   │   │   │   ├── importer.ts     # Import from file
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── events/             # Event system (public)
│   │   │   │   ├── emitter.ts      # EventEmitter
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── graph/              # LangGraph integration
│   │   │   │   ├── graph.ts
│   │   │   │   ├── checkpoints.ts
│   │   │   │   └── nodes/
│   │   │   │
│   │   │   ├── mcp/                # MCP adapter (optional)
│   │   │   │   ├── server.ts
│   │   │   │   └── adapter.ts
│   │   │   │
│   │   │   ├── tools/
│   │   │   ├── prompts/
│   │   │   ├── storage/
│   │   │   └── intervention/
│   │   │
│   │   └── dist/                   # Compiled SDK
│   │
│   ├── gui/                        # 🎨 GUI (Optional Dev Tool)
│   │   ├── package.json            # Next.js 14, React 18
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   ├── components/         # React components
│   │   │   ├── hooks/              # React hooks
│   │   │   ├── lib/                # SDK client
│   │   │   └── stores/             # Zustand stores
│   │   └── dist/                   # Next.js export
│   │
│   └── shared/                     # 📦 SHARED TYPES
│       ├── package.json
│       └── src/
│           ├── types/              # Shared TypeScript types
│           └── schemas/            # Zod schemas
│
└── README.md
```

---

## Public SDK API

### Basic Usage (No GUI)

```typescript
import { AgentFramework } from "@liberos/caf"

// Initialize
const agent = new AgentFramework({
  name: "my-agent",
  instructions: "You are a helpful coding assistant.",
  checkpoints: {
    enabled: true,
    exportDir: "./checkpoints",
  },
})

// Event handling
agent.on("checkpoint", (checkpoint) => {
  console.log("Checkpoint saved:", checkpoint.id)
})

agent.on("pause", async (pausePoint) => {
  console.log("Paused:", pausePoint.reason)
  // Auto-resume after 5 seconds
  setTimeout(() => pausePoint.resume(), 5000)
})

// Run
const result = await agent.run("Analyze this code", {
  onCheckpoint: (cp) => console.log("Step", cp.metadata.stepNumber),
  onPause: async (pause) => {
    if (pause.reason === "low_confidence") {
      // Review and decide
      await pause.resume()
    }
  },
})

// Export/Import
checkpoint = await agent.exportCheckpoint(checkpointId)
await agent.restoreCheckpoint(checkpoint)
```

### With GUI (Optional)

```typescript
// SDK (in your code)
import { AgentFramework } from "@liberos/caf"

const agent = new AgentFramework({
  // ... config
  devMode: true, // Enable WebSocket server for GUI
})

// GUI connects automatically when started
// Or export files and open in GUI
```

```bash
# Terminal 1: Run SDK
npx tsx my-agent.ts

# Terminal 2: Run GUI (optional)
npx @liberos/sentinel --watch ./checkpoints
```

---

## Decyzje Architektoniczne

### 1. SDK First

- ✅ SDK działa bez GUI (standalone library)
- ✅ GUI jest opcjonalnym narzędziem deweloperskim
- ✅ Komunikacja przez pliki (export/import) jako podstawa
- ✅ WebSocket/events jako opcjonalne ulepszenie

### 2. Export/Import jako podstawowa forma persistencji

- ✅ Checkpoints jako JSON files (przenośne, git-friendly)
- ✅ SQLite jako opcja dla wydajności
- ✅ GUI może czytać pliki bez uruchomionego SDK

### 3. Event-Driven Architecture

- ✅ Public EventEmitter dla SDK users
- ✅ Events przekazywane do GUI (opcjonalnie)
- ✅ Callbacks jako alternatywa dla events

### 4. Peer Dependencies

- ✅ Minimalne dependencies w SDK
- ✅ Drizzle, LLM SDKs jako peer deps
- ✅ User wybiera storage backend

### 5. Monorepo Structure

- ✅ SDK jako osobny pakiet
- ✅ GUI jako osobny pakiet (opcjonalny)
- ✅ Shared types jako osobny pakiet

---

## Status Decyzji

| Decyzja                 | Status               | Notatki                          |
| ----------------------- | -------------------- | -------------------------------- |
| Runtime: Bun            | ✅ Wybrany           | Szybki startup                   |
| Graph: LangGraph.js     | ✅ Wybrany           | Checkpoints wbudowane            |
| Storage: SQLite + Files | ✅ Wybrany           | JSON files default, SQLite opcja |
| SDK Architecture        | ✅ SDK First         | GUI opcjonalne                   |
| GUI Framework           | ✅ Next.js React     | Osobny pakiet                    |
| Communication           | ✅ Files + WebSocket | Pliki podstawa, WS opcjonalnie   |

---

## Usage Modes

### Mode 1: SDK Only (Library)

```typescript
// In your project
import { AgentFramework } from "@liberos/caf"

const agent = new AgentFramework(config)
const result = await agent.run(task)
// Checkpoints saved to ./checkpoints/*.json
```

### Mode 2: SDK + File Watching GUI

```bash
# Terminal 1
npx tsx my-script.ts

# Terminal 2 (optional)
npx @liberos/sentinel --watch ./checkpoints
```

### Mode 3: SDK + Real-time GUI

```typescript
// Enable WebSocket in SDK
const agent = new AgentFramework({
  ...config,
  devMode: { websocket: true },
})
```

### Mode 4: MCP Server

```bash
# MCP config
{
  "mcpServers": {
    "my-agent": {
      "command": "npx",
      "args": ["@liberos/caf", "mcp", "--config", "./agent.ts"]
    }
  }
}
```

---

## Key Difference from Previous Approach

| Aspect              | Old (GUI-Coupled)  | New (SDK First)                |
| ------------------- | ------------------ | ------------------------------ |
| **Primary Product** | GUI + SDK together | SDK standalone                 |
| **GUI Required?**   | Yes                | No, optional                   |
| **Installation**    | Single package     | SDK required, GUI optional     |
| **Communication**   | WebSocket required | Files (primary), WS (optional) |
| **Persistence**     | Database           | Files (default), DB (option)   |
| **Use Case**        | Must use GUI       | Can use SDK alone              |
| **IDE Integration** | Through MCP        | Direct SDK or MCP              |

This approach makes the SDK **library-first**, with GUI as an **optional development tool** rather than a required component.
