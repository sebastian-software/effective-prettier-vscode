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

interface IPrettierEslintOptions {
  /**
   * The path of the file being formatted
   * can be used in lieu of `eslintConfig` (eslint will be used to find the
   * relevant config for the file). Will also be used to load the `text` if
   * `text` is not provided.
   */
  filePath?: string;
  /**
   * The text (JavaScript code) to format
   */
  text: string;
  /**
   * The path to the eslint module to use.
   * Will default to require.resolve('eslint')
   */
  eslintPath?: string;
  /**
   * The config to use for formatting
   * with ESLint.
   */
  eslintConfig?: object;
  /**
   * The options to pass for
   * formatting with `prettier`. If not provided, prettier-eslint will attempt
   * to create the options based on the eslintConfig
   */
  prettierOptions?: Partial<prettier.Options>;
  /**
   * The level for the logs
   */
  logLevel?: LogLevel;
}

/**
 * Format javascript code with prettier-eslint.
 *
 * @param {IPrettierEslintOptions} options - Option bag for prettier-eslint.
 * @returns {string} the formatted code.
 */
export type PrettierEslintFormat = (options: IPrettierEslintOptions) => string;

export interface IPrettierStylelint {
  format: (options: IPrettierEslintOptions) => Promise<string>;
  resolveConfig: (
    file: string,
    options?: {
      useCache: boolean;
    }
  ) => Promise<[prettier.Options, object]>;
}
