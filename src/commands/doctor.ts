import { existsSync } from "node:fs";
import { capture, commandExists } from "../lib/command.js";
import { graphPath, projectConfigPath, savingsPath } from "../lib/paths.js";
import { ui } from "../lib/ui.js";

interface Check {
  name: string;
  ok: boolean;
  detail: string;
  required: boolean;
}

function binaryCheck(name: string, required = true): Check {
  const ok = commandExists(name);
  return {
    name,
    ok,
    detail: ok ? capture(name) || "installed" : "not found",
    required,
  };
}

export function doctorCommand(): void {
  const cwd = process.cwd();
  const major = Number(process.versions.node.split(".")[0]);
  const checks: Check[] = [
    {
      name: "Node.js",
      ok: major >= 20,
      detail: `v${process.versions.node}`,
      required: true,
    },
    binaryCheck("claude"),
    binaryCheck("graphify"),
    binaryCheck("headroom"),
    binaryCheck("uv", false),
    binaryCheck("git", false),
    {
      name: "Graphlean project config",
      ok: existsSync(projectConfigPath(cwd)),
      detail: projectConfigPath(cwd),
      required: true,
    },
    {
      name: "Graphify graph",
      ok: existsSync(graphPath(cwd)),
      detail: graphPath(cwd),
      required: false,
    },
    {
      name: "Headroom savings store",
      ok: existsSync(savingsPath()),
      detail: savingsPath(),
      required: false,
    },
  ];

  ui.title("Graphlean doctor");
  for (const check of checks) {
    const marker = check.ok ? "✓" : check.required ? "✗" : "!";
    console.log(`${marker} ${check.name}: ${check.detail}`);
  }

  const failures = checks.filter((item) => item.required && !item.ok);
  if (failures.length > 0) {
    console.log("\nRun `graphlean init` to repair the required setup.");
    process.exitCode = 1;
    return;
  }

  if (!existsSync(graphPath(cwd))) {
    console.log("\nSetup is healthy, but build the graph once with `/graphify .` inside Claude Code.");
  } else {
    console.log("\nSetup looks healthy.");
  }
}
