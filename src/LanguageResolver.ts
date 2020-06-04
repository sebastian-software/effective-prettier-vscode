import { ModuleResolver } from "./ModuleResolver"

export class LanguageResolver {
  constructor(private moduleResolver: ModuleResolver) {}

  public allEnabledLanguages(fsPath?: string): string[] {
    const enabledLanguages: string[] = []

    this.getSupportLanguages(fsPath).forEach((lang) => {
      if (lang && lang.vscodeLanguageIds) {
        enabledLanguages.push(...lang.vscodeLanguageIds)
      }
    })

    return enabledLanguages.filter((value, index, self) => self.indexOf(value) === index)
  }

  private getSupportLanguages(fsPath?: string) {
    const prettierInstance = this.moduleResolver.getEffectivePrettierInstance(fsPath)
    return prettierInstance.getPrettierSupportInfo().languages
  }
}
