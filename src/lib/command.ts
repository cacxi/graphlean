import { spawn, spawnSync, type SpawnOptions, type SpawnSyncOptions } from "node:child_process";
import { accessSync, constants } from "node:fs";

export interface RunResult {
  ok: boolean;
  status: number;
}

export function commandExists(command: string): boolean {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [command], { stdio: "ignore" });
  return result.status === 0;
}

export function executableExists(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function run(
  command: string,
  args: string[],
  options: SpawnSyncOptions = {},
): RunResult {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    return { ok: false, status: 1 };
  }

  const status = result.status ?? 1;
  return { ok: status === 0, status };
}

export function capture(command: string, args: string[] = ["--version"]): string | null {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) return null;
  return (result.stdout || result.stderr || "").trim() || null;
}

export function spawnInteractive(
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(128);
        return;
      }
      resolve(code ?? 1);
    });
  });
}
