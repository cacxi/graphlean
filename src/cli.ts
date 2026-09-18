#!/usr/bin/env node

import { initCommand } from "./commands/init.js";
import { codeCommand } from "./commands/code.js";
import { doctorCommand } from "./commands/doctor.js";
import { statsCommand } from "./commands/stats.js";
import { updateCommand } from "./commands/update.js";
import { activateLocalBin } from "./lib/paths.js";

const VERSION = "0.1.0";

activateLocalBin();

function help(): void {
  console.log(`graphlean ${VERSION}

Claude Code with Graphify-first context and Headroom token compression.

Usage:
  graphlean init [--yes] [--no-deps] [--no-git-hook]
  graphlean code [-- <claude args...>]
  graphlean doctor
  graphlean stats
  graphlean update
  graphlean --version
  graphlean --help

Commands:
  init     Install/check dependencies and configure this project
  code     Start Claude Code through Headroom with strict Graphify hooks
  doctor   Check machine and project setup
  stats    Show durable Headroom token savings
  update   Update Claude Code, Graphify and Headroom
`);
}

function hasUnknownFlags(args: string[], allowed: string[]): string | null {
  return args.find((arg) => arg.startsWith("-") && !allowed.includes(arg)) ?? null;
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    help();
    return;
  }

  if (command === "--version" || command === "-V" || command === "version") {
    console.log(VERSION);
    return;
  }

  if (command === "init") {
    const allowed = ["--yes", "-y", "--no-deps", "--no-git-hook"];
    const unknown = hasUnknownFlags(rest, allowed);
    if (unknown) throw new Error(`Unknown init option: ${unknown}`);

    await initCommand({
      yes: rest.includes("--yes") || rest.includes("-y"),
      deps: !rest.includes("--no-deps"),
      gitHook: !rest.includes("--no-git-hook"),
    });
    return;
  }

  if (command === "code") {
    const claudeArgs = rest[0] === "--" ? rest.slice(1) : rest;
    await codeCommand(claudeArgs);
    return;
  }

  if (command === "doctor") {
    doctorCommand();
    return;
  }

  if (command === "stats") {
    await statsCommand();
    return;
  }

  if (command === "update") {
    updateCommand();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
