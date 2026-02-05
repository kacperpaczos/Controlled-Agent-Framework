import type { AgentEngine } from "../agent/engine"

export interface DevServerOptions {
  port?: number
  configPath?: string
  agent?: AgentEngine
}

export async function startDevServer(options: DevServerOptions = {}): Promise<void> {
  const port = options.port ?? 3000
  let agent = options.agent

  if (!agent && options.configPath) {
    try {
      const mod = await import(options.configPath)
      const config = mod.default ?? mod.config
      if (config) {
        const { AgentEngine } = await import("../agent/engine")
        agent = new AgentEngine(config)
      }
    } catch (err) {
      console.error("Failed to load agent config:", err)
    }
  }

  const server = {
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url)
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.pathname === "/api/run" && req.method === "POST" && agent) {
        try {
          const body = (await req.json()) as { task?: string }
          const result = await agent.run(body.task ?? "")
          return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { "Content-Type": "application/json" },
          })
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { message: err instanceof Error ? err.message : String(err) },
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          )
        }
      }
      return new Response("Not Found", { status: 404 })
    },
  }

  const { createServer } = await import("http")
  const httpServer = createServer((req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
    let body = ""
    req.on("data", (chunk: Buffer) => (body += chunk.toString()))
    req.on("end", () => {
      server
        .fetch(
          new Request(`http://localhost:${port}${req.url ?? "/"}`, {
            method: req.method ?? "GET",
            body: body || undefined,
          })
        )
        .then((r) => {
          res.writeHead(r.status, { "Content-Type": "application/json" })
          return r.text()
        })
        .then((t) => res.end(t))
    })
  })
  httpServer.listen(port)

  console.log(`CAF Dev Server: http://localhost:${port}`)
  console.log(`  API: POST /api/run with { "task": "..." }`)
}
