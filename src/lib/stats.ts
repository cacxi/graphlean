import { existsSync, readFileSync } from "node:fs";
import { savingsPath } from "./paths.js";

export interface SavingsStats {
  tokensSaved: number | null;
  savingsUsd: number | null;
  source: "proxy" | "file" | "none";
}

function valueAt(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function firstNumber(value: unknown, paths: string[][]): number | null {
  for (const path of paths) {
    const found = valueAt(value, path);
    if (typeof found === "number" && Number.isFinite(found)) return found;
  }
  return null;
}

function extract(value: unknown, source: SavingsStats["source"]): SavingsStats {
  const tokensSaved = firstNumber(value, [
    ["persistent_savings", "lifetime", "tokens_saved"],
    ["lifetime", "tokens_saved"],
    ["tokens", "saved"],
    ["tokens_saved"],
    ["tokens_saved_total"],
  ]);

  const savingsUsd = firstNumber(value, [
    ["persistent_savings", "lifetime", "compression_savings_usd"],
    ["persistent_savings", "lifetime", "savings_usd"],
    ["lifetime", "compression_savings_usd"],
    ["cost", "total_savings_usd"],
    ["compression_savings_usd"],
    ["savings_usd"],
  ]);

  return { tokensSaved, savingsUsd, source };
}

export async function getSavingsStats(port = 8787): Promise<SavingsStats> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const response = await fetch(`http://127.0.0.1:${port}/stats`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const json = (await response.json()) as unknown;
      const stats = extract(json, "proxy");
      if (stats.tokensSaved !== null || stats.savingsUsd !== null) return stats;
    }
  } catch {
    // Proxy may not be running. Fall back to Headroom's durable savings file.
  }

  const path = savingsPath();
  if (!existsSync(path)) return { tokensSaved: null, savingsUsd: null, source: "none" };

  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return extract(json, "file");
  } catch {
    return { tokensSaved: null, savingsUsd: null, source: "file" };
  }
}
