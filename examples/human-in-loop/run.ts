import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "hitl-agent",
  instructions: "You assist with decisions. Ask for confirmation when unsure.",
  checkpoints: { enabled: true },
  pause: { manual: true, on_tool_error: true },
})

agent.on("agent.paused", (e) => {
  console.log("Paused:", e.pause_point.trigger)
  // W realnej aplikacji: pokaż UI, poczekaj na decyzję, wywołaj resume()
})

const result = await agent.run("Suggest a safe default action.")
console.log("Result:", result)
