import {
  CancellationToken,
  DocumentFormattingEditProvider,
  FormattingOptions,
  TextDocument,
  TextEdit
} from "vscode"

export class PrettierEditProvider implements DocumentFormattingEditProvider {
  constructor(private provideEdits: (document: TextDocument) => Promise<TextEdit[]>) {}

  public async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document)
  }
}
