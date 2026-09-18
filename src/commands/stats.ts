import { loadConfig } from "../lib/config.js";
import { getSavingsStats } from "../lib/stats.js";
import { savingsPath } from "../lib/paths.js";
import { ui } from "../lib/ui.js";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export async function statsCommand(): Promise<void> {
  const config = loadConfig();
  const stats = await getSavingsStats(config.headroomPort);

  ui.title("Graphlean token savings");
  if (stats.tokensSaved === null && stats.savingsUsd === null) {
    ui.warn("No Headroom savings have been recorded yet.");
    ui.muted(`Savings store: ${savingsPath()}`);
    console.log("Run a Claude session with `graphlean code`, then check again.");
    return;
  }

  if (stats.tokensSaved !== null) {
    console.log(`Lifetime tokens saved: ${formatNumber(stats.tokensSaved)}`);
  }
  if (stats.savingsUsd !== null) {
    console.log(`Estimated compression savings: $${stats.savingsUsd.toFixed(4)}`);
  }
  ui.muted(`Source: ${stats.source === "proxy" ? "live Headroom proxy" : savingsPath()}`);
  ui.muted("These are Headroom compression savings; Graphify does not expose a cumulative tokens-saved counter.");
}
