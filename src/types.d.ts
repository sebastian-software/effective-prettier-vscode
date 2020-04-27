import prettier from "prettier"
import effectivePrettier from "@effective/prettier"

type PrettierModule = typeof prettier
type EffectivePrettierModule = typeof effectivePrettier

type LogLevel = "error" | "warn" | "info" | "debug" | "trace"
