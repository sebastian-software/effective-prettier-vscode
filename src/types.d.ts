import prettier from "prettier"
import effectivePrettier from "@effective/prettier"

type PrettierModule = typeof prettier
type EffectivePrettierModule = typeof effectivePrettier

type TrailingCommaOption = "none" | "es5" | "all"

type LogLevel = "error" | "warn" | "info" | "debug" | "trace"

interface PrettierLintOptions {
  /**
   * The path of the file being formatted
   * can be used in lieu of `eslintConfig` (eslint will be used to find the
   * relevant config for the file).
   */
  filePath?: string
  /**
   * Whether to use verbose logging output
   */
  verbose: boolean
}

/**
 * Format javascript code with prettier-eslint.
 *
 * @param text - Input code to format
 * @param fileName - Filename of the input (used for config lookup)
 * @param options - Option bag for prettier-eslint/prettier-stylelint.
 * @returns the formatted code.
 */
export type PrettierLintFormat = (
  text: string,
  fileName: string,
  options: PrettierLintOptions
) => Promise<string>
