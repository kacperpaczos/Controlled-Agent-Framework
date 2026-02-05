import { AgentEngine } from "@liberos/caf"

const agent = new AgentEngine({
  name: "multi-step",
  instructions: "Break tasks into steps and reason about each step.",
  checkpoints: { enabled: true, auto_save: true },
})

const result = await agent.run("What are 3 steps to make coffee?")
console.log(result)
