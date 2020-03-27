import { Uri, workspace } from "vscode"
import { Options } from "prettier"

export function getConfig(uri?: Uri): Options {
  return workspace.getConfiguration("prettier", uri) as any
}
