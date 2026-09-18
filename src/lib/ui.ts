const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const color = (code: number, value: string): string =>
  enabled ? `\u001b[${code}m${value}\u001b[0m` : value;

export const ui = {
  title(message: string): void {
    console.log(`\n${color(36, color(1, message))}`);
  },
  step(message: string): void {
    console.log(`${color(36, "→")} ${message}`);
  },
  success(message: string): void {
    console.log(`${color(32, "✓")} ${message}`);
  },
  warn(message: string): void {
    console.log(`${color(33, "!")} ${message}`);
  },
  error(message: string): void {
    console.error(`${color(31, "✗")} ${message}`);
  },
  muted(message: string): void {
    console.log(color(2, message));
  },
};
