import * as prettier from "prettier";

type PrettierModule = typeof prettier;

type TrailingCommaOption = "none" | "es5" | "all";

export type PackageManagers = "npm" | "yarn" | "pnpm";

/**
 * prettier-vscode specific configuration
 */
interface IExtensionConfig {
  /**
   * Path to '.prettierignore' or similar.
   */
  ignorePath: string;
  /**
   * Path to prettier module.
   */
  prettierPath: string | undefined;
  /**
   * If true will skip formatting if a prettier config isn't found.
   */
  requireConfig: boolean;
  /**
   * The package manager to use when resolving global modules.
   */
  packageManager: PackageManagers;
  /**
   * Array of language IDs to ignore
   */
  disableLanguages: string[];
  /**
   * If true, take into account the .editorconfig file when resolving configuration.
   */
  useEditorConfig: boolean;
  /**
   * If true, this extension will attempt to use global npm or yarn modules.
   */
  resolveGlobalModules: boolean;
}
/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = IExtensionConfig & prettier.Options;

type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

interface IPrettierLintOptions {
  /**
   * The path of the file being formatted
   * can be used in lieu of `eslintConfig` (eslint will be used to find the
   * relevant config for the file).
   */
  filePath?: string;
  /**
   * Whether to use verbose logging output
   */
  verbose: boolean;
}

/**
 * Format javascript code with prettier-eslint.
 *
 * @param options - Option bag for prettier-eslint/prettier-stylelint.
 * @returns the formatted code.
 */
export type PrettierLintFormat = (
  text: string,
  options: IPrettierLintOptions
) => Promise<string>;
