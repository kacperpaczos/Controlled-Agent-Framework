import { builtinFilesystemTools } from "./filesystem"
import { builtinShellTools } from "./shell"
import { builtinSearchTools } from "./search"

export const builtinTools = [
  ...builtinFilesystemTools,
  ...builtinShellTools,
  ...builtinSearchTools,
]
