import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "basic-agent",
  instructions: "You are a helpful assistant. Respond briefly.",
  checkpoints: { enabled: true, export_dir: "./checkpoints" },
})

agent.on("agent.started", (e) => console.log("Started:", e.execution_id))
agent.on("agent.completed", (e) => console.log("Completed:", e.result))

const result = await agent.run("Say hello in one sentence.")
console.log("Result:", result)
