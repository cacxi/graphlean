import { existsSync } from "node:fs";
import { run } from "./command.js";
import { graphPath } from "./paths.js";
import { ui } from "./ui.js";

export function graphExists(cwd = process.cwd()): boolean {
  return existsSync(graphPath(cwd));
}

export function installClaudeIntegration(cwd = process.cwd()): boolean {
  const result = run(
    "graphify",
    ["claude", "install", "--project", "--strict"],
    { cwd },
  );
  return result.ok;
}

export function installGitHook(cwd = process.cwd()): boolean {
  const result = run("graphify", ["hook", "install"], { cwd });
  return result.ok;
}

export function updateGraph(cwd = process.cwd(), quiet = false): boolean {
  if (!graphExists(cwd)) {
    if (!quiet) ui.warn("No graphify-out/graph.json yet; skipping graph update.");
    return false;
  }

  if (!quiet) ui.step("Updating Graphify graph from changed files...");
  const result = run("graphify", ["update", "."], {
    cwd,
    stdio: quiet ? "ignore" : "inherit",
  });
  return result.ok;
}
