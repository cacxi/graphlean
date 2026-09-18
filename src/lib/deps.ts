import { homedir } from "node:os";
import { join } from "node:path";
import { commandExists, executableExists, run } from "./command.js";
import { confirm } from "./prompt.js";
import { ui } from "./ui.js";

export interface EnsureDependenciesOptions {
  yes?: boolean;
  installClaude?: boolean;
}

function localUvCandidate(): string {
  return join(homedir(), ".local", "bin", process.platform === "win32" ? "uv.exe" : "uv");
}

export function resolveUv(): string | null {
  if (commandExists("uv")) return "uv";
  const candidate = localUvCandidate();
  return executableExists(candidate) ? candidate : null;
}

async function installUv(yes = false): Promise<string | null> {
  ui.warn("uv is required to install Graphify and Headroom in isolated Python environments.");
  const approved = await confirm("Install uv using Astral's official installer?", yes);
  if (!approved) return null;

  if (process.platform === "win32") {
    const result = run("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "irm https://astral.sh/uv/install.ps1 | iex",
    ]);
    return result.ok ? resolveUv() : null;
  }

  const result = run("sh", [
    "-c",
    "curl -LsSf https://astral.sh/uv/install.sh | sh",
  ]);
  return result.ok ? resolveUv() : null;
}

async function ensureClaude(yes = false): Promise<boolean> {
  if (commandExists("claude")) {
    ui.success("Claude Code found");
    return true;
  }

  ui.warn("Claude Code is not installed.");
  const approved = await confirm("Install @anthropic-ai/claude-code globally with npm?", yes);
  if (!approved) return false;

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = run(npm, ["install", "-g", "@anthropic-ai/claude-code"]);
  if (!result.ok || !commandExists("claude")) {
    ui.error("Claude Code installation failed or claude is not on PATH.");
    return false;
  }

  ui.success("Claude Code installed");
  return true;
}

function ensureUvTool(uv: string, binary: string, args: string[], label: string): boolean {
  if (commandExists(binary)) {
    ui.success(`${label} found`);
    return true;
  }

  ui.step(`Installing ${label}...`);
  const result = run(uv, ["tool", "install", ...args]);
  if (!result.ok || !commandExists(binary)) {
    ui.error(`${label} installation failed or ${binary} is not on PATH.`);
    ui.muted("If uv just updated your shell PATH, open a new terminal and rerun graphlean init.");
    return false;
  }

  ui.success(`${label} installed`);
  return true;
}

export async function ensureDependencies(options: EnsureDependenciesOptions = {}): Promise<boolean> {
  if (options.installClaude !== false) {
    const claudeOk = await ensureClaude(options.yes);
    if (!claudeOk) return false;
  }

  let uv = resolveUv();
  if (!uv) uv = await installUv(options.yes);
  if (!uv) {
    ui.error("uv is required. Install it, then rerun graphlean init.");
    return false;
  }
  ui.success("uv found");

  const graphifyOk = ensureUvTool(uv, "graphify", ["graphifyy"], "Graphify");
  if (!graphifyOk) return false;

  const headroomOk = ensureUvTool(
    uv,
    "headroom",
    ["--python", "3.13", "headroom-ai[proxy]"],
    "Headroom",
  );
  if (!headroomOk) return false;

  return true;
}
