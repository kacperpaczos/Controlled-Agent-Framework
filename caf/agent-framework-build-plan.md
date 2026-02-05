# AI Agent Framework - Detailed Build Plan

## Revised Stack (React/Next Edition)

### Backend (SDK Core)

```
Runtime:        Bun (development), Node.js (production)
Graph Engine:   LangGraph.js
Storage:        SQLite + Drizzle ORM (peer dependency)
LLM Providers:  @anthropic-ai/sdk, openai
Protocol:       MCP (własna implementacja)
```

### Frontend (Dev GUI)

```
Framework:      Next.js 14 (App Router)
UI Library:     React 18
Styling:        Tailwind CSS
State:          Zustand (lightweight)
Charts:         D3.js / React Flow (visualization)
WebSocket:      Native WebSocket (real-time updates)
```

---

## Szczegółowa Struktura Katalogów

```
caf/
├── package.json                    # Root package.json (workspace config)
├── tsconfig.json                   # Root TypeScript config
├── turbo.json                      # Turborepo config (monorepo builds)
│
├── packages/
│   │
│   ├── sdk/                        # 📦 GŁÓWNA BIBLIOTEKA (SDK)
│   │   ├── package.json            # peerDependencies: drizzle-orm, better-sqlite3
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts            # Public API exports
│   │   │   ├── cli.ts              # CLI entry: npx @liberos/caf dev
│   │   │   │
│   │   │   ├── agent/              # Agent core logic
│   │   │   │   ├── engine.ts       # Main execution engine
│   │   │   │   ├── loop.ts         # Agent loop orchestration
│   │   │   │   ├── state.ts        # State management interface
│   │   │   │   └── types.ts        # Agent types & interfaces
│   │   │   │
│   │   │   ├── graph/              # LangGraph.js integration
│   │   │   │   ├── graph.ts        # Graph builder & compiler
│   │   │   │   ├── checkpoints.ts  # Checkpoint system adapter
│   │   │   │   ├── interrupt.ts    # Interrupt/pause handling
│   │   │   │   └── nodes/          # Graph node definitions
│   │   │   │       ├── entry.ts    # Entry node
│   │   │   │       ├── thought.ts  # Thought processing
│   │   │   │       ├── tool.ts     # Tool execution
│   │   │   │       └── exit.ts     # Exit node
│   │   │   │
│   │   │   ├── mcp/                # MCP Protocol Server
│   │   │   │   ├── server.ts       # Main MCP server (stdio)
│   │   │   │   ├── protocol.ts     # JSON-RPC protocol handler
│   │   │   │   ├── handlers.ts     # MCP method handlers
│   │   │   │   ├── resources.ts    # MCP resources
│   │   │   │   ├── tools.ts        # MCP tools registry
│   │   │   │   └── types.ts        # MCP types
│   │   │   │
│   │   │   ├── tools/              # Tool Registry System
│   │   │   │   ├── registry.ts     # Tool registration & discovery
│   │   │   │   ├── definitions.ts  # Tool definitions
│   │   │   │   ├── validator.ts    # Tool input validation
│   │   │   │   ├── executor.ts     # Tool execution wrapper
│   │   │   │   └── types.ts        # Tool types
│   │   │   │
│   │   │   ├── prompts/            # Prompt System
│   │   │   │   ├── compiler.ts     # Prompt compilation engine
│   │   │   │   ├── templates.ts    # Template definitions
│   │   │   │   ├── registry.ts     # Prompt template registry
│   │   │   │   ├── hooks.ts        # Plugin hooks system
│   │   │   │   ├── context.ts      # Context management
│   │   │   │   └── types.ts        # Prompt types
│   │   │   │
│   │   │   ├── storage/            # Data Layer
│   │   │   │   ├── db.ts           # Database connection
│   │   │   │   ├── schemas.ts      # Drizzle schemas
│   │   │   │   ├── migrations/     # Database migrations
│   │   │   │   ├── repositories/   # Data access layer
│   │   │   │   │   ├── checkpoint.ts
│   │   │   │   │   ├── execution.ts
│   │   │   │   │   ├── thought.ts
│   │   │   │   │   └── event.ts
│   │   │   │   └── types.ts
│   │   │   │
│   │   │   ├── observability/      # Monitoring & Debugging
│   │   │   │   ├── events.ts       # Event bus
│   │   │   │   ├── logger.ts       # Structured logging
│   │   │   │   ├── traces.ts       # Execution tracing
│   │   │   │   ├── metrics.ts      # Performance metrics
│   │   │   │   └── websocket.ts    # WebSocket server for GUI
│   │   │   │
│   │   │   ├── reasoning/          # Reasoning & Explainability
│   │   │   │   ├── chain.ts        # Thought chain builder
│   │   │   │   ├── explain.ts      # Explanation generator
│   │   │   │   ├── alternatives.ts # Alternative tracking
│   │   │   │   └── confidence.ts   # Confidence scoring
│   │   │   │
│   │   │   ├── intervention/       # Human-in-the-Loop
│   │   │   │   ├── pause.ts        # Pause point manager
│   │   │   │   ├── handler.ts      # Intervention handler
│   │   │   │   ├── session.ts      # Intervention session
│   │   │   │   └── api.ts          # Intervention API
│   │   │   │
│   │   │   └── server/             # Dev Server (HTTP + WebSocket)
│   │   │       ├── http.ts         # HTTP server for GUI
│   │   │       ├── websocket.ts    # WebSocket for real-time
│   │   │       ├── api.ts          # REST API routes
│   │   │       └── static.ts       # Static file serving
│   │   │
│   │   └── dist/                   # Compiled SDK
│   │
│   ├── gui/                        # 🎨 NEXT.JS GUI (Dev Dashboard)
│   │   ├── package.json            # Next.js 14, React 18 dependencies
│   │   ├── tsconfig.json
│   │   ├── next.config.js          # Next.js config (output: standalone)
│   │   ├── tailwind.config.js      # Tailwind CSS config
│   │   ├── postcss.config.js       # PostCSS config
│   │   ├── public/                 # Static assets
│   │   │   ├── favicon.ico
│   │   │   └── logo.svg
│   │   │
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   │   ├── layout.tsx      # Root layout
│   │   │   │   ├── page.tsx        # Dashboard home
│   │   │   │   ├── globals.css     # Global styles
│   │   │   │   │
│   │   │   │   ├── agent/
│   │   │   │   │   ├── page.tsx    # Agent builder page
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Agent detail/edit
│   │   │   │   │
│   │   │   │   ├── execution/
│   │   │   │   │   ├── page.tsx    # Execution monitor
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx # Execution detail
│   │   │   │   │       └── checkpoint/
│   │   │   │   │           └── [checkpointId]/
│   │   │   │   │               └── page.tsx # Checkpoint view
│   │   │   │   │
│   │   │   │   ├── thoughts/
│   │   │   │   │   ├── page.tsx    # Thought chain viewer
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Thought detail
│   │   │   │   │
│   │   │   │   ├── checkpoints/
│   │   │   │   │   ├── page.tsx    # Checkpoints list
│   │   │   │   │   └── compare/
│   │   │   │   │       └── page.tsx # Diff/compare view
│   │   │   │   │
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx    # Settings page
│   │   │   │
│   │   │   ├── components/         # React Components
│   │   │   │   ├── layout/
│   │   │   │   │   ├── sidebar.tsx # Navigation sidebar
│   │   │   │   │   ├── header.tsx  # Top header
│   │   │   │   │   └── layout.tsx  # Main layout wrapper
│   │   │   │   │
│   │   │   │   ├── agent/
│   │   │   │   │   ├── builder.tsx # Visual agent builder
│   │   │   │   │   ├── graph.tsx   # Agent graph visualization
│   │   │   │   │   ├── nodes/      # Agent node components
│   │   │   │   │   │   ├── system-node.tsx
│   │   │   │   │   │   ├── instruction-node.tsx
│   │   │   │   │   │   ├── tool-node.tsx
│   │   │   │   │   │   ├── condition-node.tsx
│   │   │   │   │   │   └── loop-node.tsx
│   │   │   │   │   └── config/
│   │   │   │   │       ├── agent-config.tsx
│   │   │   │   │       └── tool-config.tsx
│   │   │   │   │
│   │   │   │   ├── execution/
│   │   │   │   │   ├── monitor.tsx # Real-time execution monitor
│   │   │   │   │   ├── timeline.tsx # Execution timeline
│   │   │   │   │   ├── controls.tsx # Pause/resume buttons
│   │   │   │   │   └── status.tsx   # Status indicators
│   │   │   │   │
│   │   │   │   ├── thoughts/
│   │   │   │   │   ├── chain.tsx    # Thought chain tree
│   │   │   │   │   ├── detail.tsx   # Thought detail view
│   │   │   │   │   ├── reasoning.tsx # Reasoning visualization
│   │   │   │   │   └── confidence.tsx # Confidence visualization
│   │   │   │   │
│   │   │   │   ├── checkpoints/
│   │   │   │   │   ├── list.tsx     # Checkpoints list
│   │   │   │   │   ├── card.tsx     # Checkpoint card
│   │   │   │   │   ├── diff.tsx     # State diff view
│   │   │   │   │   └── restore.tsx  # Restore checkpoint UI
│   │   │   │   │
│   │   │   │   ├── shared/
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── modal.tsx
│   │   │   │   │   └── tooltip.tsx
│   │   │   │   │
│   │   │   │   └── visualization/
│   │   │   │       ├── flow.tsx     # React Flow wrapper
│   │   │   │       ├── graph.tsx    # Graph visualization
│   │   │   │       └── tree.tsx     # Tree visualization
│   │   │   │
│   │   │   ├── hooks/              # React Hooks
│   │   │   │   ├── use-websocket.ts    # WebSocket connection
│   │   │   │   ├── use-execution.ts    # Execution state
│   │   │   │   ├── use-checkpoints.ts  # Checkpoints data
│   │   │   │   ├── use-thoughts.ts     # Thoughts data
│   │   │   │   └── use-intervention.ts # Intervention state
│   │   │   │
│   │   │   ├── lib/                # Utilities
│   │   │   │   ├── api.ts          # API client
│   │   │   │   ├── websocket.ts    # WebSocket client
│   │   │   │   ├── utils.ts        # Helper functions
│   │   │   │   └── constants.ts    # Constants
│   │   │   │
│   │   │   ├── stores/             # Zustand Stores
│   │   │   │   ├── execution-store.ts
│   │   │   │   ├── checkpoint-store.ts
│   │   │   │   ├── thought-store.ts
│   │   │   │   └── ui-store.ts
│   │   │   │
│   │   │   └── types/              # TypeScript Types
│   │   │       ├── agent.ts
│   │   │       ├── execution.ts
│   │   │       ├── checkpoint.ts
│   │   │       └── websocket.ts
│   │   │
│   │   └── dist/                   # Next.js build output
│   │
│   └── shared/                     # 📦 SHARED TYPES & UTILS
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/              # Shared TypeScript types
│           │   ├── agent.ts
│           │   ├── execution.ts
│           │   ├── checkpoint.ts
│           │   ├── thought.ts
│           │   └── mcp.ts
│           ├── schemas/            # Zod schemas (validation)
│           │   ├── agent.ts
│           │   ├── execution.ts
│           │   └── checkpoint.ts
│           └── utils/              # Shared utilities
│               ├── id.ts           # ID generation
│               └── time.ts         # Time utilities
│
├── examples/                       # 📚 PRZYKŁADY UŻYCIA
│   ├── basic-agent/
│   │   ├── package.json
│   │   ├── agent.config.ts
│   │   └── README.md
│   ├── multi-step/
│   │   ├── package.json
│   │   └── agent.config.ts
│   └── human-in-loop/
│       ├── package.json
│       └── agent.config.ts
│
├── docs/                           # 📖 DOKUMENTACJA
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── agent-builder.md
│   ├── checkpoint-system.md
│   ├── intervention.md
│   └── development.md
│
└── scripts/                        # 🔧 BUILD SCRIPTS
    ├── build.ts                    # Build SDK + GUI
    ├── dev.ts                      # Dev mode launcher
    └── test.ts                     # Test runner
```

---

## Architektura Integracji SDK ↔ GUI

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER WORKSPACE                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   MCP CLIENT (IDE: Cursor/VSCode)            │  │
│  │                                                              │  │
│  │  User: "Analyze this code"                                   │  │
│  │              │                                               │  │
│  │              ▼                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │              MCP PROTOCOL (STDIN/STDOUT)              │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT FRAMEWORK (SDK Core)                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Agent Execution Engine                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │  Graph      │  │  Checkpoints│  │  Interrupt/Pause   │  │  │
│  │  │  Runner     │  │  (Snapshots)│  │  (Human-in-loop)   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │  Tool       │  │  Prompt     │  │  Reasoning         │  │  │
│  │  │  Registry   │  │  Compiler   │  │  Chain             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Observability Layer                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│  │  │  Event Bus  │  │  Snapshots  │  │  WebSocket Server  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ WebSocket (localhost:3001)
                               │ HTTP API (localhost:3001/api)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DEV GUI (Next.js Application)                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                         Next.js App                           │  │
│  │                                                              │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │  │
│  │  │  Agent Builder│  │  Execution    │  │  Checkpoint     │  │  │
│  │  │  (Visual)     │  │  Monitor      │  │  Inspector      │  │  │
│  │  └───────────────┘  └───────────────┘  └─────────────────┘  │  │
│  │                                                              │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │  │
│  │  │  Thought      │  │  Intervention │  │  Settings       │  │  │
│  │  │  Chain        │  │  Panel        │  │  Panel          │  │  │
│  │  └───────────────┘  └───────────────┘  └─────────────────┘  │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │                WebSocket Client                       │    │  │
│  │  │     (Real-time updates from SDK Core)               │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Komunikacja SDK → GUI

### WebSocket Events (Real-time)

```typescript
// Typy zdarzeń wysyłanych z SDK do GUI

interface AgentEvent {
  type: "agent.started" | "agent.paused" | "agent.resumed" | "agent.completed"
  executionID: string
  agentID: string
  timestamp: number
  data: any
}

interface ThoughtEvent {
  type: "thought.created" | "thought.updated"
  executionID: string
  thoughtID: string
  thought: ThoughtStep
  timestamp: number
}

interface CheckpointEvent {
  type: "checkpoint.created"
  executionID: string
  checkpointID: string
  checkpoint: Checkpoint
  timestamp: number
}

interface ToolEvent {
  type: "tool.called" | "tool.completed" | "tool.failed"
  executionID: string
  toolID: string
  arguments: any
  result?: any
  error?: string
  duration: number
  timestamp: number
}

interface PauseEvent {
  type: "execution.paused"
  executionID: string
  pausePointID: string
  reason: string
  checkpointID: string
  availableActions: Action[]
}
```

### HTTP API (Request/Response)

```typescript
// Endpoints dostępne z GUI

// GET /api/agents - Lista agentów
// GET /api/agents/:id - Szczegóły agenta
// POST /api/agents - Utwórz agenta
// PUT /api/agents/:id - Aktualizuj agenta
// DELETE /api/agents/:id - Usuń agenta

// GET /api/executions - Lista wykonań
// GET /api/executions/:id - Szczegóły wykonania
// POST /api/executions - Rozpocznij wykonanie
// POST /api/executions/:id/pause - Wstrzymaj
// POST /api/executions/:id/resume - Wznów
// POST /api/executions/:id/cancel - Anuluj

// GET /api/executions/:id/checkpoints - Lista checkpointów
// GET /api/checkpoints/:id - Szczegóły checkpointu
// POST /api/checkpoints/:id/restore - Przywróć checkpoint
// POST /api/checkpoints/compare - Porównaj checkpointi

// GET /api/executions/:id/thoughts - Lista myśli
// GET /api/thoughts/:id - Szczegóły myśli

// POST /api/interventions/:id/respond - Odpowiedź na interwencję
// POST /api/interventions/:id/edit - Edytuj stan
```

---

## Budowanie i Deployment

### Development Mode

```bash
# Własny workspace użytkownika
mkdir my-agent-project
cd my-agent-project
npm init
npm install @liberos/sdk drizzle-orm better-sqlite3

# Utwórz agent.config.ts
cat > agent.config.ts << 'EOF'
import { defineAgent } from '@liberos/sdk';

export default defineAgent({
  name: 'my-first-agent',
  instructions: 'You are a helpful coding assistant.',
  tools: ['read_file', 'write_file'],
  checkpoints: true,
  pauseOnLowConfidence: true,
});
EOF

# Uruchom dev server (uruchamia zarówno SDK jak i GUI)
npx @liberos/caf dev

# SDK działa na localhost:3000 (MCP)
# GUI działa na localhost:3001 (Next.js)
```

### Production Mode

```bash
# Build SDK
npm run build:sdk

# Build GUI (static export)
npm run build:gui

# Dist struktura:
dist/
├── sdk/                    # Compiled SDK (CommonJS + ESM)
│   ├── index.js
│   ├── index.d.ts
│   └── cli.js
├── gui/                    # Static Next.js export
│   ├── index.html
│   ├── _next/
│   └── ...
└── bin/
    └── agent-framework     # CLI binary

# Użytkownik instaluje:
npm install @liberos/sdk

# MCP config w IDE:
# {
#   "mcpServers": {
#     "agent-framework": {
#       "command": "npx",
#       "args": ["@liberos/sdk", "mcp"],
#       "env": {
#         "AGENT_CONFIG": "./agent.config.ts"
#       }
#     }
#   }
# }
```

---

## Kluczowe Decyzje Implementacyjne

### 1. **Monorepo z Workspaces**

```
- Turborepo do zarządzania buildami
- Shared types między SDK a GUI
- Independent versioning (SDK może być używany bez GUI)
```

### 2. **WebSocket dla Real-time Updates**

```
- SDK: ws biblioteka (lub native Bun WebSocket)
- GUI: Native WebSocket client
- Auto-reconnect z exponential backoff
- Event sourcing pattern (wszystkie zdarzenia zapisywane)
```

### 3. **State Management**

```
- SDK: Własny event bus + SQLite persistence
- GUI: Zustand (lightweight, no boilerplate)
- Sync: WebSocket events → Zustand store updates
```

### 4. **Visual Graph Editor**

```
- React Flow dla drag-and-drop graph builder
- D3.js dla statycznych visualizacji
- Custom nodes dla każdego typu agent block
```

### 5. **Checkpoint Diff**

```
- Deep-diff biblioteka do porównywania stanów
- Visual diff w GUI (kolorowanie zmian)
- JSON patch format dla edycji
```

### 6. **Type Safety**

```
- Shared Zod schemas w packages/shared
- Runtime validation na granicach (API, WebSocket)
- Full TypeScript coverage (strict mode)
```

---

## Uruchamianie w Różnych Trybach

### Tryb 1: SDK Only (Programmatic)

```typescript
import { AgentFramework } from "@liberos/sdk"

const framework = new AgentFramework({
  configPath: "./agent.config.ts",
  storage: "./data.db",
})

const result = await framework.run("Analyze this code", {
  onCheckpoint: (checkpoint) => console.log("Checkpoint:", checkpoint.id),
  onPause: (pause) => console.log("Paused:", pause.reason),
})
```

### Tryb 2: MCP Server (IDE Integration)

```bash
# MCP config
{
  "mcpServers": {
    "my-agent": {
      "command": "npx",
      "args": ["@liberos/sdk", "mcp", "--config", "./agent.config.ts"]
    }
  }
}

# IDE używa agenta przez MCP protocol
# Brak GUI, wszystko w IDE
```

### Tryb 3: Dev Mode (SDK + GUI)

```bash
npx @liberos/caf dev

# Otwiera:
# - MCP server na stdin/stdout (dla IDE)
# - HTTP server na :3000 (API dla GUI)
# - WebSocket server na :3001 (real-time)
# - Next.js dev server na :3002 (GUI)

# User widzi GUI w przeglądarce
# Może pauzować, edytować, oglądać
```

---

## Podsumowanie Architektury

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREE LAYER ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 3: PRESENTATION (Next.js GUI)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Visual Agent Builder                                  │   │
│  │  • Real-time Execution Monitor                           │   │
│  │  • Checkpoint Inspector & Diff                           │   │
│  │  • Thought Chain Visualization                           │   │
│  │  • Intervention Panel                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │ WebSocket / HTTP API                  │
│                         ▼                                        │
│  LAYER 2: CORE (SDK - LangGraph.js)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Agent Execution Engine (LangGraph.js)                │   │
│  │  • Checkpoint & State Management                        │   │
│  │  • Tool Registry & Execution                            │   │
│  │  • Prompt Compilation System                            │   │
│  │  • Reasoning & Explainability                           │   │
│  │  • Human-in-the-Loop System                             │   │
│  │  • Event Bus & Observability                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │ MCP Protocol / Direct Import          │
│                         ▼                                        │
│  LAYER 1: DATA (Storage + LLM)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • SQLite + Drizzle ORM (State Persistence)             │   │
│  │  • LLM Provider APIs (Anthropic, OpenAI, etc.)          │   │
│  │  • File System (Tool access)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Ta architektura pozwala na:

- ✅ **SDK standalone** - użycie bez GUI (programmatic, MCP)
- ✅ **Rich GUI** - pełna wizualizacja i edycja
- ✅ **Real-time updates** - WebSocket sync między SDK a GUI
- ✅ **Type safety** - shared types między warstwami
- ✅ **Extensibility** - plugin hooks w SDK, custom components w GUI
