import { commandExists, run } from "../lib/command.js";
import { resolveUv } from "../lib/deps.js";
import { graphExists, installClaudeIntegration, updateGraph } from "../lib/graphify.js";
import { ui } from "../lib/ui.js";

export function updateCommand(): void {
  const cwd = process.cwd();
  const uv = resolveUv();

  ui.title("Updating Graphlean dependencies");
  if (!uv) {
    ui.error("uv was not found. Run `graphlean init` first.");
    process.exitCode = 1;
    return;
  }

  for (const [packageName, label] of [
    ["graphifyy", "Graphify"],
    ["headroom-ai", "Headroom"],
  ] as const) {
    ui.step(`Updating ${label}...`);
    const result = run(uv, ["tool", "upgrade", packageName]);
    if (!result.ok) ui.warn(`${label} update failed; continuing.`);
  }

  if (commandExists("claude")) {
    ui.step("Updating Claude Code...");
    const result = run("claude", ["update"]);
    if (!result.ok) ui.warn("Claude Code update failed; continuing.");
  }

  if (commandExists("graphify")) {
    ui.step("Reapplying strict Graphify project hooks...");
    if (!installClaudeIntegration(cwd)) ui.warn("Could not reapply Graphify integration.");

    if (graphExists(cwd)) updateGraph(cwd, false);
  }

  ui.success("Update complete");
}
