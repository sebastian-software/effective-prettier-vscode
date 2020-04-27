/* eslint-disable max-statements */

import prettier from "prettier"
import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  Range,
  TextDocument,
  TextEdit,
  languages,
  workspace
} from "vscode"

import { LanguageResolver } from "./LanguageResolver"
import { LoggingService } from "./LoggingService"
import { ModuleResolver } from "./ModuleResolver"
import { NotificationService } from "./NotificationService"
import { PrettierEditProvider } from "./PrettierEditProvider"
import { FormattingResult, StatusBarService } from "./StatusBarService"

interface RangeFormattingOptions {
  rangeStart: number
  rangeEnd: number
}

interface LanguageSelectors {
  rangeLanguageSelector: DocumentSelector
  languageSelector: DocumentSelector
}

/**
 * Prettier reads configuration from files
 */
const PRETTIER_CONFIG_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  "package.json",
  "prettier.config.js"
]

export default class PrettierEditService implements Disposable {
  private formatterHandler: undefined | Disposable
  private rangeFormatterHandler: undefined | Disposable

  // eslint-disable-next-line max-params
  constructor(
    private moduleResolver: ModuleResolver,
    private languageResolver: LanguageResolver,
    private loggingService: LoggingService,
    private notificationService: NotificationService,
    private statusBarService: StatusBarService
  ) {}

  public registerDisposables(): Disposable[] {
    const packageWatcher = workspace.createFileSystemWatcher("**/package.json")
    packageWatcher.onDidChange(this.registerFormatter)
    packageWatcher.onDidCreate(this.registerFormatter)
    packageWatcher.onDidDelete(this.registerFormatter)

    const configurationWatcher = workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("prettier")) {
        this.registerFormatter()
      }
    })

    const workspaceWatcher = workspace.onDidChangeWorkspaceFolders(this.registerFormatter)

    const prettierConfigWatcher = workspace.createFileSystemWatcher(
      `**/{${PRETTIER_CONFIG_FILES.join(",")}}`
    )
    prettierConfigWatcher.onDidChange(this.registerFormatter)
    prettierConfigWatcher.onDidCreate(this.registerFormatter)
    prettierConfigWatcher.onDidDelete(this.registerFormatter)

    return [ packageWatcher, configurationWatcher, workspaceWatcher, prettierConfigWatcher ]
  }

  public registerFormatter = () => {
    this.dispose()
    const { languageSelector, rangeLanguageSelector } = this.selectors()
    const editProvider = new PrettierEditProvider(this.provideEdits)
    this.rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
      rangeLanguageSelector,
      editProvider
    )
    this.formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      editProvider
    )
  }

  public dispose = () => {
    this.notificationService.dispose()
    this.formatterHandler?.dispose()
    this.rangeFormatterHandler?.dispose()
    this.formatterHandler = undefined
    this.rangeFormatterHandler = undefined
  }

  /**
   * Build formatter selectors
   */
  private selectors = (): LanguageSelectors => {
    let allLanguages: string[]
    if (workspace.workspaceFolders === undefined) {
      allLanguages = this.languageResolver.allEnabledLanguages()
    } else {
      allLanguages = []
      for (const folder of workspace.workspaceFolders) {
        const allWorkspaceLanguages = this.languageResolver.allEnabledLanguages(
          folder.uri.fsPath
        )
        allWorkspaceLanguages.forEach((lang) => {
          if (!allLanguages.includes(lang)) {
            allLanguages.push(lang)
          }
        })
      }
    }

    this.loggingService.logInfo("Enabling prettier for languages", allLanguages.sort())

    const allRangeLanguages = this.languageResolver.rangeSupportedLanguages()
    this.loggingService.logInfo(
      "Enabling prettier for range supported languages",
      allRangeLanguages.sort()
    )

    if (workspace.workspaceFolders === undefined) {
      // no workspace opened
      return {
        languageSelector: allLanguages,
        rangeLanguageSelector: allRangeLanguages
      }
    }

    // at least 1 workspace
    const untitledLanguageSelector: DocumentFilter[] = allLanguages.map((l) => ({
      language: l,
      scheme: "untitled"
    }))
    const untitledRangeLanguageSelector: DocumentFilter[] = allRangeLanguages.map((l) => ({
      language: l,
      scheme: "untitled"
    }))
    const fileLanguageSelector: DocumentFilter[] = allLanguages.map((l) => ({
      language: l,
      scheme: "file"
    }))
    const fileRangeLanguageSelector: DocumentFilter[] = allRangeLanguages.map((l) => ({
      language: l,
      scheme: "file"
    }))

    return {
      languageSelector: untitledLanguageSelector.concat(fileLanguageSelector),
      rangeLanguageSelector: untitledRangeLanguageSelector.concat(fileRangeLanguageSelector)
    }
  }

  private provideEdits = async (
    document: TextDocument,
    options?: RangeFormattingOptions
  ): Promise<TextEdit[]> => {
    const hrStart = process.hrtime()
    const result = await this.format(document.getText(), document, options)
    if (!result) {
      // No edits happened, return never so VS Code can try other formatters
      return []
    }
    const hrEnd = process.hrtime(hrStart)
    this.loggingService.logInfo(`Formatting completed in ${hrEnd[1] / 1000000}ms.`)
    return [ TextEdit.replace(this.fullDocumentRange(document), result) ]
  }

  /**
   * Format the given text with user's configuration.
   *
   * @param text Text to format
   * @param path formatting file's path
   * @returns formatted text
   */
  private async format(
    text: string,
    { fileName, languageId, uri, isUntitled }: TextDocument,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Promise<string | undefined> {
    this.loggingService.logInfo(`Formatting ${fileName}`)

    const prettierInstance = this.moduleResolver.getPrettierInstance(fileName, {
      showNotifications: true
    })

    let fileInfo: prettier.FileInfoResult | undefined
    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, {
        resolveConfig: true // Fix for 1.19 (https://prettier.io/blog/2019/11/09/1.19.0.html#api)
      })
      this.loggingService.logInfo("File Info:", fileInfo)
    }

    if (fileInfo && fileInfo.ignored) {
      this.loggingService.logInfo("File is ignored, skipping.")
      this.statusBarService.updateStatusBar(FormattingResult.Ignore)
      return
    }

    const effectivePrettierInstance = this.moduleResolver.getEffectivePrettierInstance(
      fileName
    )
    return this.safeExecution(
      async () =>
        effectivePrettierInstance.formatText(text, fileName, {
          autoRoot: true,
          verbose: true
        }),
      text
    )
  }

  /**
   * Execute a callback safely, if it doesn't work, return default and log messages.
   *
   * @param cb The function to be executed,
   * @param defaultText The default value if execution of the cb failed
   * @param fileName The filename of the current document
   * @returns formatted text or defaultText
   */
  private async safeExecution(
    callback: () => Promise<string>,
    defaultText: string
  ): Promise<string> {
    try {
      const returnValue = await callback()
      this.statusBarService.updateStatusBar(FormattingResult.Success)

      return returnValue
    } catch (error) {
      this.loggingService.logError("Error formatting document.", error)
      this.statusBarService.updateStatusBar(FormattingResult.Error)

      return defaultText
    }
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length)
  }
}
