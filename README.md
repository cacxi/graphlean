# graphlean

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

Run Claude Code with Graphify-first codebase context and Headroom token compression.

Graphlean is a thin CLI wrapper around three existing tools:

- **Claude Code** — coding agent
- **Graphify** — codebase knowledge graph + Claude hooks
- **Headroom** — context compression proxy and durable token-savings metrics

It does not fork or modify Claude. It makes the setup repeatable and launches Claude through the same optimized path every time.

## Requirements

Graphlean has **zero runtime npm dependencies**.

- Node.js 20+
- Internet access during first-time dependency installation
- A Claude account/API configuration supported by Claude Code

`graphlean init` installs or checks four external tools:

| Tool | Detected as | Installed by `init` |
| --- | --- | --- |
| Claude Code | `claude` | `npm install -g @anthropic-ai/claude-code` |
| uv | `uv` | Astral's official installer |
| Graphify | `graphify` | `uv tool install graphifyy` |
| Headroom | `headroom` | `uv tool install --python 3.13 headroom-ai[proxy]` |

It asks before installing system-level prerequisites unless `--yes` is supplied.

## Quickstart

Graphlean is not published to npm yet, so install it from source:

```bash
git clone git@github.com:cacxi/graphlean.git
cd graphlean
npm install
npm run build
npm link
```

Then set up any project you want to work in:

```bash
cd ~/my-project
graphlean init
```

`init` installs missing dependencies, wires up Graphify's strict Claude hooks, writes the project config, and then opens Claude Code to build the code graph with `/graphify .`. Exit that session with `/exit` when the graph finishes.

From then on, normal usage is just:

```bash
graphlean code
```

## Commands

| Command | Description |
| --- | --- |
| `graphlean init` | Install/check dependencies, configure this project, build the graph |
| `graphlean code` | Start Claude Code through Headroom with strict Graphify hooks |
| `graphlean doctor` | Check machine and project setup |
| `graphlean stats` | Show durable Headroom token savings |
| `graphlean update` | Update Claude Code, Graphify and Headroom |
| `graphlean --version` | Print the version |
| `graphlean --help` | Print usage |

### `graphlean init`

Installs/checks Claude Code, uv, Graphify, and Headroom. Then it installs Graphify's Claude integration with strict project hooks, installs the Graphify git hook when the current directory is a Git repository, writes the project config, and builds the code graph if one does not exist yet.

```bash
graphlean init

graphlean init --yes          # don't ask before system-level installs

graphlean init --no-deps      # require the tools already be on PATH

graphlean init --no-git-hook  # skip the Graphify git hook

graphlean init --no-graph     # skip the code graph build
```

The graph build opens an interactive Claude Code session running `/graphify .`. It is interactive on purpose: `/graphify .` is a Claude Code slash command, and only a live session can run the extraction subagents it dispatches. If the graph cannot be built, `init` warns and still completes — nothing else in the setup depends on it.

An existing graph is never rebuilt. Use `graphlean code` to keep it up to date.

### `graphlean code`

Starts Claude Code through Headroom with strict Graphify enabled.

```bash
graphlean code
```

Forward Claude flags after `--`:

```bash
graphlean code -- --model sonnet
```

Each launch:

1. Re-applies Graphify's **project + strict** Claude integration.
2. Sets `GRAPHIFY_HOOK_STRICT=1` for the Claude session.
3. Updates an existing Graphify graph before the session.
4. Launches `headroom wrap claude` with local telemetry enabled.
5. Uses a Graphlean-specific persistent Headroom savings file.
6. Updates the graph again after the Claude session exits.

Graphify strict mode redirects the first raw source read in a Claude session to the graph and then falls back to its normal soft steering. It is not a guarantee that every later file read will go through the graph.

### `graphlean stats`

Shows durable token savings recorded by Headroom for Graphlean-launched sessions.

```bash
graphlean stats
```

Graphlean stores its Headroom savings at:

```text
~/.graphlean/headroom-savings.json
```

The token number is Headroom's measured compression savings. Graphify currently does not provide a cumulative historical "tokens saved" counter, so Graphlean does not fabricate or add an estimate for Graphify.

### `graphlean doctor`

Checks the current machine/project:

```bash
graphlean doctor
```

Reports Node.js version, the four external tools, the project config, the code graph, and the savings store. Exits non-zero when a required check fails.

### `graphlean update`

Updates Graphify and Headroom through uv, asks Claude Code to update itself, reapplies strict project hooks, and refreshes the graph when one exists.

```bash
graphlean update
```

## Configuration

`graphlean init` writes `.graphlean/config.json` in the project directory:

```json
{
  "version": 1,
  "strictGraphify": true,
  "headroomTelemetry": true,
  "autoUpdateGraph": true,
  "headroomPort": 8787
}
```

| Key | Default | Effect |
| --- | --- | --- |
| `version` | `1` | Config schema version. Always forced to `1` on load. |
| `strictGraphify` | `true` | Re-apply strict hooks on launch and set `GRAPHIFY_HOOK_STRICT=1`. |
| `headroomTelemetry` | `true` | Sets `HEADROOM_TELEMETRY=on` for the session. |
| `autoUpdateGraph` | `true` | Refresh the graph before and after each `graphlean code` session. |
| `headroomPort` | `8787` | Port `graphlean stats` queries for live Headroom stats. |

A missing or malformed config falls back to these defaults rather than failing.

## Environment

Read by Graphlean:

| Variable | Effect |
| --- | --- |
| `GRAPHLEAN_HOME` | Override Graphlean's home directory. Default `~/.graphlean`. |
| `NO_COLOR` | Disable colored output. |

```bash
GRAPHLEAN_HOME=/custom/path graphlean code
```

Set by Graphlean for the Claude session: `GRAPHIFY_HOOK_STRICT`, `HEADROOM_TELEMETRY`, and `HEADROOM_SAVINGS_PATH`.

## Security note

Graphlean deliberately does **not** use npm `postinstall` to silently install Python tools or run remote scripts. Dependency installation happens explicitly when you run `graphlean init`. If `uv` is missing, Graphlean asks before running Astral's official uv installer.

## Publishing

Verify the package name is available, then publish:

```bash
npm view graphlean
npm login
npm publish --access public
```

After publishing, installation becomes:

```bash
npm install -g graphlean
```

## License

Apache-2.0
