import { Disposable, window } from "vscode"

import { LoggingService } from "./LoggingService"

export class NotificationService implements Disposable {
  constructor(private loggingService: LoggingService) {}

  public async showErrorMessage(message: string, extraLines?: string[]) {
    let result: string | undefined
    if (extraLines) {
      const lines = [ message ]
      lines.push(...extraLines)
      result = await window.showErrorMessage(lines.join(" "), "Show Log")
    } else {
      result = await window.showErrorMessage(message, "Show Log")
    }
    if (result && result === "Show Log") {
      this.loggingService.show()
    }
  }

  public dispose() {}
}
