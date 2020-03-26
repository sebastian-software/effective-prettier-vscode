import { ExtensionContext, commands } from "vscode"

import { ConfigResolver } from "./ConfigResolver"
import { LanguageResolver } from "./LanguageResolver"
import { LoggingService } from "./LoggingService"
import { ModuleResolver } from "./ModuleResolver"
import { NotificationService } from "./NotificationService"
import PrettierEditService from "./PrettierEditService"
import { StatusBarService } from "./StatusBarService"

// the application insights key (also known as instrumentation key)
const extensionName =
  process.env.EXTENSION_NAME || "sebastian-software.effective-prettier-vscode"
const extensionVersion = process.env.EXTENSION_VERSION || "0.0.0"

export function activate(context: ExtensionContext) {
  const hrStart = process.hrtime()

  const loggingService = new LoggingService()

  loggingService.logInfo(`Extension Name: ${extensionName}.`)
  loggingService.logInfo(`Extension Version: ${extensionVersion}.`)

  const openOutputCommand = commands.registerCommand("prettier.openOutput", () => {
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

  const hrEnd = process.hrtime(hrStart)
}

export function deactivate() {}
