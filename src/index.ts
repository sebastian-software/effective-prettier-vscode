import { ExtensionContext, commands } from "vscode"

import { ConfigResolver } from "./ConfigResolver"
import { LanguageResolver } from "./LanguageResolver"
import { LoggingService } from "./LoggingService"
import { ModuleResolver } from "./ModuleResolver"
import { NotificationService } from "./NotificationService"
import PrettierEditService from "./PrettierEditService"
import { StatusBarService } from "./StatusBarService"

// the application insights key (also known as instrumentation key)
export function activate(context: ExtensionContext) {
  const hrStart = process.hrtime()

  const loggingService = new LoggingService()

  loggingService.logInfo(`Extension Name: ${process.env.BUNDLE_NAME}.`)
  loggingService.logInfo(`Extension Version: ${process.env.BUNDLE_VERSION}.`)

  const openOutputCommand = commands.registerCommand("effective-prettier.openOutput", () => {
    loggingService.show()
  })

  const configResolver = new ConfigResolver(loggingService)
  const notificationService = new NotificationService(loggingService)

  const moduleResolver = new ModuleResolver(loggingService, notificationService)

  const languageResolver = new LanguageResolver(moduleResolver)

  const statusBarService = new StatusBarService(languageResolver, loggingService)

  const editService = new PrettierEditService(
    moduleResolver,
    languageResolver,
    configResolver,
    loggingService,
    notificationService,
    statusBarService
  )
  editService.registerFormatter()

  context.subscriptions.push(
    editService,
    openOutputCommand,
    ...editService.registerDisposables(),
    ...statusBarService.registerDisposables()
  )
}

export function deactivate() {}
