/**
 * Minimal LLM provider interface for testing the library.
 * OpenRouter implementation: one-shot chat completion via OpenRouter API.
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMCompletionResult {
  content: string
  usage?: { prompt_tokens: number; completion_tokens: number }
}

/**
 * Minimal contract for an LLM provider (e.g. for use in CAF graph nodes).
 */
export interface LLMProvider {
  chat(messages: LLMMessage[]): Promise<LLMCompletionResult>
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export interface OpenRouterProviderOptions {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Minimal OpenRouter provider: calls OpenRouter chat completions API.
 * API key must be provided via options (e.g. from env); no keys in code.
 */
export class OpenRouterProvider implements LLMProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly temperature?: number
  private readonly maxTokens?: number

  constructor(options: OpenRouterProviderOptions) {
    if (!options.apiKey?.trim()) {
      throw new Error("OpenRouterProvider requires a non-empty apiKey (e.g. from OPENROUTER_API_KEY).")
    }
    this.apiKey = options.apiKey.trim()
    this.model = options.model ?? "z-ai/glm-4.5-air:free"
    this.temperature = options.temperature
    this.maxTokens = options.maxTokens
  }

  async chat(messages: LLMMessage[]): Promise<LLMCompletionResult> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }
    if (this.temperature !== undefined) body.temperature = this.temperature
    if (this.maxTokens !== undefined) body.max_tokens = this.maxTokens

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter API error ${res.status}: ${text}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }

    const content =
      data.choices?.[0]?.message?.content ?? ""
    const usage = data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens ?? 0,
          completion_tokens: data.usage.completion_tokens ?? 0,
        }
      : undefined

    return { content, usage }
  }
}
