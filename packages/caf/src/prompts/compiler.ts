import type { Context } from "@liberos/caf-shared"

export interface PromptHook {
  transform(compiled: string, context: Context): string
}

export class PromptCompiler {
  private hooks: PromptHook[] = []

  compile(template: string, context: Context): string {
    let compiled = template

    for (const [key, value] of Object.entries(context.variables)) {
      compiled = compiled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value))
    }

    for (const hook of this.hooks) {
      compiled = hook.transform(compiled, context)
    }

    return compiled
  }

  registerHook(hook: PromptHook): void {
    this.hooks.push(hook)
  }
}
