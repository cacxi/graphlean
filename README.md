# Graphlean

Graphlean is a thin CLI wrapper around three existing tools:

- **Claude Code** — coding agent
- **Graphify** — codebase knowledge graph + Claude hooks
- **Headroom** — context compression proxy and durable token-savings metrics

It does not fork or modify Claude. It makes the setup repeatable and launches Claude through the same optimized path every time.

## What `graphlean code` enforces

1. Re-applies Graphify's **project + strict** Claude integration.
2. Sets `GRAPHIFY_HOOK_STRICT=1` for the Claude session.
3. Updates an existing Graphify graph before the session.
4. Launches `headroom wrap claude` with local telemetry enabled.
5. Uses a Graphlean-specific persistent Headroom savings file.
6. Updates the graph again after the Claude session exits.

Graphify strict mode redirects the first raw source read in a Claude session to the graph and then falls back to its normal soft steering. It is not a guarantee that every later file read will go through the graph.

## Requirements

Graphlean has **zero runtime npm dependencies**.

- Node.js 20+
- Internet access during first-time dependency installation
- A Claude account/API configuration supported by Claude Code

`graphlean init` can install Claude Code, `uv`, Graphify and Headroom. It asks before installing system-level prerequisites unless `--yes` is supplied.

## Local development

```bash
npm install
npm run build
npm link
```

Then, from another project:

```bash
cd ~/my-project
graphlean init
```

If the project does not have a Graphify graph yet:

```bash
graphlean code
```

Then run this once inside Claude Code:

```text
/graphify .
```

After that, normal usage is simply:

```bash
graphlean code
```

## Commands

### `graphlean init`

Installs/checks Claude Code, uv, Graphify, and Headroom. Then it installs Graphify's Claude integration with strict project hooks and installs the Graphify git hook when the current directory is a Git repository.

```bash
graphlean init

graphlean init --yes

graphlean init --no-deps

graphlean init --no-git-hook
```

### `graphlean code`

Starts Claude Code through Headroom with strict Graphify enabled.

```bash
graphlean code
```

Forward Claude flags after `--`:

```bash
graphlean code -- --model sonnet
```

### `graphlean stats`

Shows durable token savings recorded by Headroom for Graphlean-launched sessions.

```bash
graphlean stats
```

Graphlean stores its Headroom savings at:

```text
~/.graphlean/headroom-savings.json
```

Override Graphlean's home directory with:

```bash
GRAPHLEAN_HOME=/custom/path graphlean code
```

The token number is Headroom's measured compression savings. Graphify currently does not provide a cumulative historical "tokens saved" counter, so Graphlean does not fabricate or add an estimate for Graphify.

### `graphlean doctor`

Checks the current machine/project:

```bash
graphlean doctor
```

### `graphlean update`

Updates Graphify and Headroom through uv, asks Claude Code to update itself, reapplies strict project hooks, and refreshes the graph when one exists.

```bash
graphlean update
```

## Publishing

Before publishing, verify that the package name is available in npm:

```bash
npm view graphlean
```

Then:

```bash
npm login
npm publish --access public
```

After publishing:

```bash
npm install -g graphlean

graphlean init
graphlean code
```

## Security note

Graphlean deliberately does **not** use npm `postinstall` to silently install Python tools or run remote scripts. Dependency installation happens explicitly when you run `graphlean init`. If `uv` is missing, Graphlean asks before running Astral's official uv installer.

## License

Apache-2.0
