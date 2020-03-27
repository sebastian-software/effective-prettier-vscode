import { Disposable, window } from "vscode"

import { LoggingService } from "./LoggingService"
import { VIEW_LOGS_ACTION_TEXT } from "./message"

export class NotificationService implements Disposable {
  constructor(private loggingService: LoggingService) {}

  public async showErrorMessage(message: string, extraLines?: string[]) {
    let result: string | undefined
    if (extraLines) {
      const lines = [ message ]
      lines.push(...extraLines)
      result = await window.showErrorMessage(lines.join(" "), VIEW_LOGS_ACTION_TEXT)
    } else {
      result = await window.showErrorMessage(message, VIEW_LOGS_ACTION_TEXT)
    }
    if (result && result === VIEW_LOGS_ACTION_TEXT) {
      this.loggingService.show()
    }
  }

  public dispose() {}
}
