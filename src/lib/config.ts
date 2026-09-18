import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { projectConfigPath } from "./paths.js";

export interface GraphleanConfig {
  version: 1;
  strictGraphify: boolean;
  headroomTelemetry: boolean;
  autoUpdateGraph: boolean;
  headroomPort: number;
}

export const defaultConfig: GraphleanConfig = {
  version: 1,
  strictGraphify: true,
  headroomTelemetry: true,
  autoUpdateGraph: true,
  headroomPort: 8787,
};

export function loadConfig(cwd = process.cwd()): GraphleanConfig {
  const path = projectConfigPath(cwd);
  if (!existsSync(path)) return { ...defaultConfig };

  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<GraphleanConfig>;
    return { ...defaultConfig, ...raw, version: 1 };
  } catch {
    return { ...defaultConfig };
  }
}

export function writeConfig(config: GraphleanConfig, cwd = process.cwd()): string {
  const path = projectConfigPath(cwd);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return path;
}
