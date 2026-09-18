import { homedir } from "node:os";
import { delimiter, join } from "node:path";
import { mkdirSync } from "node:fs";

export function localBinDir(): string {
  return join(homedir(), ".local", "bin");
}

export function activateLocalBin(): void {
  const bin = localBinDir();
  const current = process.env.PATH || "";
  const entries = current.split(delimiter).filter(Boolean);
  if (!entries.includes(bin)) {
    process.env.PATH = [bin, ...entries].join(delimiter);
  }
}

export function graphleanHome(): string {
  return process.env.GRAPHLEAN_HOME || join(homedir(), ".graphlean");
}

export function ensureGraphleanHome(): string {
  const dir = graphleanHome();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function savingsPath(): string {
  return join(ensureGraphleanHome(), "headroom-savings.json");
}

export function projectConfigPath(cwd = process.cwd()): string {
  return join(cwd, ".graphlean", "config.json");
}

export function graphPath(cwd = process.cwd()): string {
  return join(cwd, "graphify-out", "graph.json");
}
