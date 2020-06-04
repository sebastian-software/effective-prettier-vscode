import path from "path"

import mem from "mem"
import readPkgUp from "read-pkg-up"
import resolve from "resolve"
import importGlobal from "import-global"
import { Disposable } from "vscode"

import { LoggingService } from "./LoggingService"
import { NotificationService } from "./NotificationService"
import { EffectivePrettierModule, PrettierModule } from "./types"

const prettier = importGlobal.silent("prettier")
const effectivePrettier = importGlobal.silent("@effective/prettier")

interface ModuleResult<T> {
  moduleInstance: T | undefined
  modulePath: string | undefined
}

interface ModuleResolutionOptions {
  showNotifications: boolean
}

export class ModuleResolver implements Disposable {
  private findPkgMem: (fsPath: string, pkgName: string) => string | undefined
  private resolvedModules = new Array<string>()

  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {
    this.findPkgMem = mem(this.findPkg, {
      cacheKey: (parameters: string[]) => `${parameters[0]}:${parameters[1]}`
    })
  }

  /**
   * Returns an instance of the prettier module.
   *
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public getPrettierInstance(
    fileName?: string,
    options?: ModuleResolutionOptions
  ): PrettierModule {
    if (!fileName) {
      return prettier
    }

    const { moduleInstance } = this.requireLocalPkg<PrettierModule>(
      fileName,
      "prettier",
      options
    )

    return moduleInstance || prettier
  }

  /**
   * Returns an instance of the @effective/prettier module.
   *
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public getEffectivePrettierInstance(
    fileName?: string,
    options?: ModuleResolutionOptions
  ): EffectivePrettierModule {
    if (!fileName) {
      return effectivePrettier
    }

    const { moduleInstance } = this.requireLocalPkg<EffectivePrettierModule>(
      fileName,
      "@effective/prettier",
      options
    )

    return moduleInstance || effectivePrettier
  }

  /**
   * Require package explicitly installed relative to given path.
   * Fallback to bundled one if no package was found bottom up.
   *
   * @param fsPath file system path starting point to resolve package
   * @param packageName package's name to require
   * @returns module
   */
  private requireLocalPkg<T>(
    fsPath: string,
    packageName: string,
    options?: ModuleResolutionOptions
  ): ModuleResult<T> {
    let modulePath
    this.loggingService.logInfo(`Local load package: ${packageName}`)

    try {
      modulePath = this.findPkgMem(fsPath, packageName)

      if (modulePath !== undefined) {
        const moduleInstance = this.loadNodeModule(modulePath)
        if (!this.resolvedModules.includes(modulePath)) {
          this.resolvedModules.push(modulePath)
        }
        this.loggingService.logInfo(
          `Loaded module '${packageName}@${
            moduleInstance.version ?? "unknown"
          }' from '${modulePath}'`
        )
        return { moduleInstance, modulePath }
      }
    } catch (error) {
      this.loggingService.logError(`Failed to load local module ${packageName}.`, error)
      if (options?.showNotifications) {
        this.notificationService.showErrorMessage(
          "Failed to load module. If you have prettier or plugins referenced in package.json, ensure you have run `npm install`",
          [ `Attempted to load ${packageName} from ${modulePath || "package.json"}` ]
        )
      }
    }
    return { moduleInstance: undefined, modulePath }
  }

  private loadNodeModule(moduleName: string): any | undefined {
    try {
      return require(moduleName)
    } catch (error) {
      this.loggingService.logError(`Error loading node module '${moduleName}'`, error)
    }

  }

  /**
   * Recursively search for a package.json upwards containing given package
   * as a dependency or devDependency.
   *
   * @param fsPath file system path to start searching from
   * @param packageName package's name to search for
   * @returns resolved path to module
   */
  private findPkg(fsPath: string, packageName: string): string | undefined {
    // Get the closest `package.json` file, that's outside of any `node_modules`
    // directory.
    const splitPath = fsPath.split("/")
    let finalPath = fsPath
    const nodeModulesIndex = splitPath.indexOf("node_modules")

    if (nodeModulesIndex > 1) {
      finalPath = splitPath.slice(0, nodeModulesIndex).join("/")
    }

    const res = readPkgUp.sync({ cwd: finalPath, normalize: false })
    const { root } = path.parse(finalPath)

    if (
      res &&
      res.packageJson &&
      ((res.packageJson.dependencies && res.packageJson.dependencies[packageName]) ||
        (res.packageJson.devDependencies && res.packageJson.devDependencies[packageName]))
    ) {
      return resolve.sync(packageName, { basedir: res.path })
    } if (res && res.path) {
      const parent = path.resolve(path.dirname(res.path), "..")
      if (parent !== root) {
        return this.findPkg(parent, packageName)
      }
    }

  }

  public dispose() {
    // pass
  }
}
