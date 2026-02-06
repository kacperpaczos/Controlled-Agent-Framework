# Changelog

All notable changes to CAF (Controlled Agent Framework) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-02-05

### Changed

- Reorganized documentation structure
  - Moved specification files from `caf/` to `docs/architecture/`
  - Updated README.md to English with product-focused description
  - Created CHANGELOG.md for version history
- Removed redundant `caf/caf-schemas.ts` (schemas now in `packages/shared/`)

### Documentation

- Added `docs/architecture/specification.md` - full framework specification
- Added `docs/architecture/data-layers.md` - 3-layer data architecture explanation

## [0.0.1] - 2026-02-05

### Added

- Initial CAF framework implementation
- **@liberos/caf** SDK package
  - AgentEngine with run/on/exportCheckpoint/restoreCheckpoint API
  - CAFGraph execution engine (simple runner, LangGraph.js integration pending)
  - 3-layer checkpoint system (Runtime → JSON → SQLite)
  - CheckpointManager with hybrid file+database storage
  - ToolRegistry with builtin tools (read_file, write_file, edit_file, bash, glob, grep)
  - CAFEventBus with type-safe discriminated unions
  - PausePointManager for human-in-the-loop
  - PromptCompiler with template variables and hooks
  - MCP server adapter (STDIN/STDOUT JSON-RPC)
  - Dev HTTP server
  - CLI with `caf dev` and `caf mcp` commands
- **@liberos/caf-shared** package
  - Zod schemas split into modules (thought, context, tool, agent, checkpoint, event, intervention, etc.)
  - Full type exports
  - VERSION = "0.0.1"
- **@liberos/sentinel** GUI package
  - Next.js 14 App Router
  - Tailwind CSS styling
  - React Flow for thought chain visualization
  - Zustand stores (execution, checkpoint, thought, intervention, ui)
  - WebSocket client for real-time events
  - Pages: Dashboard, Execution Monitor, Thoughts, Checkpoints, Intervention
- **Examples**
  - basic-agent – minimal setup
  - multi-step – multi-step reasoning
  - human-in-loop – pause/resume demonstration
- **Documentation**
  - getting-started.md
  - api-reference.md
  - checkpoint-system.md
  - intervention.md

### Infrastructure

- Monorepo with Turborepo
- npm workspaces for package management
- TypeScript with strict mode
- Drizzle ORM schemas for SQLite (checkpoints, thoughts, tool_calls, executions)
