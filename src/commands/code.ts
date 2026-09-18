import { commandExists } from "../lib/command.js";
import { loadConfig } from "../lib/config.js";
import { graphExists, installClaudeIntegration, updateGraph } from "../lib/graphify.js";
import { sessionEnv } from "../lib/session.js";
import { spawnInteractive } from "../lib/command.js";
import { ui } from "../lib/ui.js";

export async function codeCommand(claudeArgs: string[] = []): Promise<void> {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  for (const command of ["claude", "graphify", "headroom"]) {
    if (!commandExists(command)) {
      ui.error(`${command} is missing. Run: graphlean init`);
      process.exitCode = 1;
      return;
    }
  }

  // Reapply the project integration on every launch. Graphify's installer is
  // idempotent and this repairs deleted/stale project hooks automatically.
  if (config.strictGraphify) {
    ui.step("Ensuring strict Graphify hooks are active...");
    if (!installClaudeIntegration(cwd)) {
      ui.error("Could not activate Graphify's Claude integration.");
      process.exitCode = 1;
      return;
    }
  }

  const hadGraph = graphExists(cwd);
  if (hadGraph && config.autoUpdateGraph) {
    updateGraph(cwd, false);
  } else if (!hadGraph) {
    ui.warn("No Graphify graph found. Inside Claude, run `/graphify .` once.");
  }

  ui.title("Starting Claude Code through Headroom + Graphify");
  ui.muted("Graphify strict mode: ON · Headroom compression: ON · persistent savings: ON");

  const env = sessionEnv(config);

  let exitCode = 1;
  try {
    exitCode = await spawnInteractive("headroom", ["wrap", "claude", ...claudeArgs], {
      cwd,
      env,
    });
  } catch (error) {
    ui.error(`Could not start Headroom/Claude: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  if (config.autoUpdateGraph && graphExists(cwd)) {
    ui.step("Refreshing Graphify after the Claude session...");
    updateGraph(cwd, true);
  }

  process.exitCode = exitCode;
}
