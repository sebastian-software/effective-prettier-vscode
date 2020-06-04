import path from "path"
import fs from "fs"

import mem from "mem"
import findUp from "find-up"
import resolve from "resolve"
import importGlobal from "import-global"
import { Disposable } from "vscode"

import { LoggingService } from "./LoggingService"
import { NotificationService } from "./NotificationService"
import { EffectivePrettierModule } from "./types"

const effectivePrettier = importGlobal.silent("@effective/prettier")

interface ModuleResolutionOptions {
  showNotifications: boolean
}

export class ModuleResolver implements Disposable {
  private findPkgMem: (fsPath: string, pkgName: string) => string | undefined
  private requireLocalPkgMem: (fsPath: string, pkgName: string) => any
  private resolvedModules = new Array<string>()

  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {
    this.findPkgMem = mem(this.findPkg, {
      cacheKey: (parameters: string[]) => `${parameters[0]}:${parameters[1]}`
    })
    this.requireLocalPkgMem = mem(this.requireLocalPkg, {
      cacheKey: (parameters: string[]) => `${parameters[0]}:${parameters[1]}`
    })
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

    const moduleInstance = this.requireLocalPkgMem<EffectivePrettierModule>(
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
  ) {
    let modulePath
    this.loggingService.logInfo(`Trying to load locally installed package: ${packageName}...`)

    try {
      modulePath = this.findPkgMem(fsPath, packageName)
      if (!modulePath) {
        return
      }

      const moduleInstance = this.loadNodeModule(modulePath, fsPath)
      if (!this.resolvedModules.includes(modulePath)) {
        this.resolvedModules.push(modulePath)
      }
      this.loggingService.logInfo(
        `Loaded module '${packageName}@${
          moduleInstance.version ?? "unknown"
        }' from '${modulePath}'`
      )
      return moduleInstance
    } catch (error) {
      this.loggingService.logError(`Failed to load local module ${packageName}.`, error)
      if (options?.showNotifications) {
        this.notificationService.showErrorMessage(
          `Failed to load module ${packageName}. Please make sure that it is installed locally!`,
          [ `Attempted to load ${packageName} from ${modulePath || "package.json"}` ]
        )
      }
    }
  }

  private loadNodeModule(moduleName: string, fsPath: string): any | undefined {
    try {
      const previousDirectory = process.cwd()
      const importDirectory = path.dirname(fsPath)
      process.chdir(importDirectory)
      const module = require(moduleName)
      process.chdir(previousDirectory)
      return module
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

    this.loggingService.logInfo(`Trying to find package ${packageName} in ${finalPath}...`)
    const packagePath = findUp.sync("package.json", { cwd: finalPath })
    if (!packagePath) {
      return
    }

    const basedir = path.dirname(packagePath)
    const json = JSON.parse(fs.readFileSync(packagePath, "utf8"))

    if (
      json &&
      ((json.dependencies && json.dependencies[packageName]) ||
        (json.devDependencies && json.devDependencies[packageName]))
    ) {
      return resolve.sync(packageName, { basedir })
    }

    const parent = path.resolve(basedir, "..")
    return this.findPkg(parent, packageName)
  }

  public dispose() {
    // pass
  }
}
