import type { GraphleanConfig } from "./config.js";
import { savingsPath } from "./paths.js";

export function sessionEnv(
  config: GraphleanConfig,
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GRAPHIFY_HOOK_STRICT: config.strictGraphify ? "1" : "0",
    HEADROOM_TELEMETRY: config.headroomTelemetry ? "on" : "off",
    HEADROOM_SAVINGS_PATH: savingsPath(),
    ...overrides,
  };
}
