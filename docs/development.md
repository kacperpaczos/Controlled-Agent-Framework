# Development & Testing

This document describes the `dev/` folder and tools used to develop and test the CAF library (e.g. LLM integration without committing secrets).

**Requirements:** The project uses [Bun](https://bun.sh) as runtime and package manager. Install Bun from [bun.sh](https://bun.sh) if needed (`curl -fsSL https://bun.sh/install | bash`).

## dev/ folder

The `dev/` directory contains scripts and a minimal LLM provider for local development and testing. It is not published as a package.

| File | Purpose |
|------|--------|
| **`.env`** | Local environment variables (API keys). **Not committed** – ignored via `.gitignore`. |
| **`.env.example`** | Template for `.env`. Copy to `.env` and set `OPENROUTER_API_KEY`. |
| **`openrouter-provider.ts`** | Minimal LLM provider interface and OpenRouter implementation for tests. |
| **`test-openrouter-provider.ts`** | TypeScript test script that runs a chat via `OpenRouterProvider`. |
| **`test-openrouter.sh`** | Shell script that calls the OpenRouter API with `curl` (smoke test). |

### Environment and secrets

- **Never commit API keys.** Use `dev/.env` for `OPENROUTER_API_KEY`; the file is listed in `.gitignore` and `dev/.env`.
- Copy `dev/.env.example` to `dev/.env` and set your key. Get an API key at [OpenRouter](https://openrouter.ai).

## OpenRouter provider (minimal LLM for tests)

A minimal provider is available in `dev/openrouter-provider.ts` for testing the library with a real chat API (OpenRouter). It is intended for development and integration tests, not as part of the published SDK.

### Interfaces

- **`LLMMessage`** – `{ role: "system" | "user" | "assistant", content: string }`
- **`LLMCompletionResult`** – `{ content: string, usage?: { prompt_tokens, completion_tokens } }`
- **`LLMProvider`** – `chat(messages: LLMMessage[]): Promise<LLMCompletionResult>`

### OpenRouterProvider

- **Constructor:** `new OpenRouterProvider({ apiKey, model?, temperature?, maxTokens? })`
  - `apiKey` is required (e.g. from `process.env.OPENROUTER_API_KEY`). No keys in code.
  - `model` – default `z-ai/glm-4.5-air:free`
- **Method:** `chat(messages)` – one-shot completion via OpenRouter API.

### Running the provider test

From the repository root:

```bash
# Ensure OPENROUTER_API_KEY is set (e.g. in dev/.env). The test script loads dev/.env automatically.
bun run dev/test-openrouter-provider.ts
```

Or using the shell smoke test (loads `dev/.env` when run from `dev/`):

```bash
./dev/test-openrouter.sh
```

### Example usage in code

```typescript
import { OpenRouterProvider } from "./dev/openrouter-provider"

const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) throw new Error("OPENROUTER_API_KEY required")

const provider = new OpenRouterProvider({ apiKey, model: "z-ai/glm-4.5-air:free" })
const result = await provider.chat([
  { role: "user", content: "What is the meaning of life? One sentence." },
])
console.log(result.content, result.usage)
```

## Building and running examples

From the repo root:

```bash
bun install
bun run build
cd examples/basic-agent && bun install && bun start
```

See [Getting Started](getting-started.md) and [API Reference](api-reference.md) for full documentation.
