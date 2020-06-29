import {
  Disposable,
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  languages,
  window
} from "vscode"

import { LanguageResolver } from "./LanguageResolver"

export enum FormattingResult {
  Success = "check",
  Ignore = "x",
  Error = "alert"
}

export class StatusBarService {
  private statusBarItem: StatusBarItem
  constructor(private languageResolver: LanguageResolver) {
    // Setup the statusBarItem
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, -1)
    this.statusBarItem.text = "✪ Prettier"
    this.statusBarItem.command = "effective-prettier.openOutput"

    this.toggleStatusBarItem(window.activeTextEditor)
  }
  public registerDisposables(): Disposable[] {
    return [
      // Keep track whether to show/hide the statusbar
      window.onDidChangeActiveTextEditor((editor) => {
        this.toggleStatusBarItem(editor)
      })
    ]
  }

  /**
   * Update the statusBarItem message and show the statusBarItem
   *
   * @param result The the icon to use
   */
  public updateStatusBar(result: FormattingResult): void {
    this.statusBarItem.text = `✪ Prettier: $(${result.toString()})`
    this.statusBarItem.show()
  }

  private toggleStatusBarItem(editor: TextEditor | undefined): void {
    if (editor !== undefined) {
      // The function will be triggered every time the active "editor" instance changes
      // It also triggers when we focus on the output panel or on the debug panel
      // Both are seen as an "editor".
      // The following check will ignore such panels
      if ([ "debug", "output" ].some((part) => editor.document.uri.scheme === part)) {
        return
      }

      const filePath = editor.document.isUntitled ? undefined : editor.document.fileName
      const score = languages.match(
        this.languageResolver.allEnabledLanguages(filePath),
        editor.document
      )

      if (score > 0) {
        this.statusBarItem.show()
      } else {
        this.statusBarItem.hide()
      }
    } else {
      this.statusBarItem.hide()
    }
  }
}
