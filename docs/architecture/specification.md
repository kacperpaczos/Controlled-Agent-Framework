# CAF - Controlled Agent Framework

## Naming

- **Organization**: `@liberos`
- **SDK**: `caf` (@liberos/caf) - Controlled Agent Framework
- **GUI**: `sentinel` (@liberos/sentinel) - Watcher/Observer tool

## Philosophy: SDK First

**The library/SDK is the main product.** GUI is an optional development tool, not required for the framework to function.

### SDK First Principles:

1. **SDK works standalone** - can be used without GUI (programmatic, MCP)
2. **GUI is separable** - separate package, optional installation
3. **Communication is optional** - SDK doesn't require WebSocket/HTTP for basic functionality
4. **Public API is stable** - GUI uses only public API, not internals
5. **Minimal dependencies** - SDK has only essential peer dependencies

---

## Functional Requirements

### 1. Architecture

- **Framework for writing AI agents**
- **Delivered as SDK/library** - primary distribution form
- **MCP server as adapter** - optional wrapper for IDE integration
- **GUI as dev tool** - optional development tool
- JS/TS only (Bun or Node.js)

### 2. SDK Core Functionality

- Create/edit agent loops (programmatic API)
- Work with tools (tool registry)
- Model tuning
- Dynamic prompt composition based on context
- **Exportability** - checkpoints, execution traces as files

### 3. Control and Observability (SDK Level)

- Control agent thinking process (callbacks, hooks)
- Full execution process observation (event emitters)
- Checkpoint/snapshot system (file-based + optionally DB)
- Workflow pausing (async/await, generators)
- Resume from state X (checkpoint restore)

### 4. Human-in-the-Loop (SDK Level)

- Programmatic intervention API (async pause/resume)
- Decision explanation/justification system (reasoning traces)
- Event system for external handlers
- **GUI integration** - optional, through event bus

### 5. Dev GUI (Optional Package)

- **Not required for SDK operation**
- Uses public SDK API (events, checkpoints, exports)
- Can be run separately and connect to running SDK
- Next.js + React (standalone application)
- Data structure preview
- Relationship visualization
- Runtime state editing (through SDK API)
- User intervention sessions

### 6. Prompt Engineering

- Base prompt structures (system, agent, instruction)
- Structure validation
- Dynamic templates
- Plugin hooks
- Export/import config as files

### 7. Extensibility

- Ability to write own extensions
- Flexible SDK architecture
- Plugin system (hooks, middleware)
- Custom storage backends
