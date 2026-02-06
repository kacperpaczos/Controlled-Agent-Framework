/**
 * Test script for OpenRouterProvider. Loads OPENROUTER_API_KEY from dev/.env.
 * Run from repo root: npx tsx dev/test-openrouter-provider.ts
 * Or: cd dev && source .env && npx tsx test-openrouter-provider.ts
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { OpenRouterProvider } from "./openrouter-provider"

const __dirname = dirname(fileURLToPath(import.meta.url))
const devDir = join(__dirname, ".")
const envPath = join(devDir, ".env")

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf-8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=")
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
        if (!(key in process.env)) process.env[key] = value
      }
    }
  }
}

const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set. Copy dev/.env.example to dev/.env and set the key.")
  process.exit(1)
}

async function main() {
  const provider = new OpenRouterProvider({ apiKey })
  const result = await provider.chat([
    { role: "user", content: "What is the meaning of life? Reply in one short sentence." },
  ])
  console.log("Assistant:", result.content)
  if (result.usage) console.log("Usage:", result.usage)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
