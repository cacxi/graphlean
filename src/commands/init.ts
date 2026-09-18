import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureDependencies } from "../lib/deps.js";
import { writeConfig, defaultConfig } from "../lib/config.js";
import { buildGraph, installClaudeIntegration, installGitHook, graphExists } from "../lib/graphify.js";
import { commandExists, run } from "../lib/command.js";
import { ui } from "../lib/ui.js";

export interface InitOptions {
  yes?: boolean;
  deps?: boolean;
  gitHook?: boolean;
  graph?: boolean;
}

function inGitRepo(cwd: string): boolean {
  if (!commandExists("git")) return false;
  const result = run("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd,
    stdio: "ignore",
  });
  return result.ok;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  ui.title("Graphlean setup");

  if (options.deps !== false) {
    const ok = await ensureDependencies({ yes: options.yes });
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  } else {
    for (const command of ["claude", "graphify", "headroom"]) {
      if (!commandExists(command)) {
        ui.error(`${command} is required but was not found.`);
        process.exitCode = 1;
        return;
      }
    }
  }

  ui.step("Installing strict Graphify integration for Claude Code...");
  if (!installClaudeIntegration(cwd)) {
    ui.error("Graphify Claude integration failed.");
    process.exitCode = 1;
    return;
  }
  ui.success("Graphify skill + Claude hooks installed for this project");

  if (options.gitHook !== false) {
    if (inGitRepo(cwd)) {
      ui.step("Installing Graphify git hook...");
      if (installGitHook(cwd)) ui.success("Graphify git hook installed");
      else ui.warn("Could not install the Graphify git hook; runtime integration still works.");
    } else {
      ui.warn("Not inside a git repository; skipped Graphify git hook.");
    }
  }

  const configPath = writeConfig(defaultConfig, cwd);
  ui.success(`Graphlean config written to ${configPath}`);

  if (graphExists(cwd)) {
    ui.success("Existing Graphify graph found");
  } else if (options.graph === false) {
    ui.warn("Skipped the code graph build (--no-graph).");
    console.log("  Run `graphlean code`, then run `/graphify .` once inside Claude Code.");
  } else if (await buildGraph(cwd)) {
    ui.success("Graphify code graph built");
  } else {
    // A missing graph must not fail setup; everything else is already in place.
    ui.warn("The code graph was not built.");
    console.log("  Run `graphlean code`, then run `/graphify .` once inside Claude Code.");
  }

  if (!existsSync(join(cwd, ".claude"))) {
    ui.warn(".claude/ was not created. Check Graphify's install output above.");
  }

  console.log("\nReady. Start coding with: graphlean code");
}
