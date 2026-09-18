import { existsSync } from "node:fs";
import { run, spawnInteractive } from "./command.js";
import { loadConfig } from "./config.js";
import { graphPath } from "./paths.js";
import { sessionEnv } from "./session.js";
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

// The first graph has to be built by `/graphify .`, which is a Claude Code slash
// command: only a live Claude session can run the skill's extraction subagents.
// The session is interactive on purpose. In `--print` mode Claude auto-denies
// permission prompts, so the extraction would quietly produce nothing.
export async function buildGraph(cwd = process.cwd()): Promise<boolean> {
  if (graphExists(cwd)) return true;

  ui.step("Building the Graphify code graph...");
  ui.muted("Claude Code will open and run `/graphify .`. Exit with /exit when it finishes.");

  // Strict mode redirects the first raw source read to the graph. There is no
  // graph to redirect to yet, so it stays off for the bootstrap build.
  const env = sessionEnv(loadConfig(cwd), { GRAPHIFY_HOOK_STRICT: "0" });

  try {
    await spawnInteractive("headroom", ["wrap", "claude", "/graphify ."], { cwd, env });
  } catch (error) {
    ui.warn(`Could not start Headroom/Claude: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }

  // The graph file on disk is the success signal, not the session's exit code -
  // the user may exit Claude cleanly without ever completing the build.
  return graphExists(cwd);
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
