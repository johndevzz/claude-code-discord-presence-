# Claude Code Discord Presence

A tiny Discord Rich Presence daemon that shows what [Claude Code](https://claude.com/claude-code)
is doing, live, in your Discord status — thinking, running a tool, waiting for
input, idle — along with the project name, git branch, and model.

```
Working on Discord Claude Code (main)
Reading files · Using Sonnet 5
```

## How it works

- A Claude Code [hook](https://docs.claude.com/en/docs/claude-code/hooks) fires
  on every session event (prompt submitted, tool started, tool finished, etc.)
  and writes the current state to `state.json`.
- A background daemon watches `state.json` and pushes it to Discord over RPC
  using [`@xhayper/discord-rpc`](https://github.com/xhayper/discord-rpc).
- If nothing updates for 10 minutes (e.g. you closed the terminal), the
  presence is cleared automatically.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- The Discord **desktop app**, running and logged in (Rich Presence doesn't
  work through the browser)
- [Claude Code](https://claude.com/claude-code) used from a terminal

## Setup

```bash
git clone <this-repo-url> "Discord Claude Code"
cd "Discord Claude Code"
npm install
npm run setup   # registers the Claude Code hooks for you
npm start        # leave this running in a terminal
```

`npm run setup` merges the required hooks into your `~/.claude/settings.json`
— it won't touch any other hooks you already have configured, and it's safe
to run more than once.

Then just use Claude Code normally. Your Discord status should update within
a few seconds of starting a session.

To run the daemon silently in the background on Windows without a terminal
window, double-click `start-hidden.vbs` instead of `npm start` (e.g. drop a
shortcut to it in your Startup folder to launch it on login).

### Removing it

```bash
npm run setup:uninstall   # removes the hooks from ~/.claude/settings.json
```

Then stop the daemon (close its terminal, or end the `node` process if you
used `start-hidden.vbs`).

## Configuration

The daemon works out of the box using a shared Discord Application so nobody
has to set one up themselves. If you'd like your own branding instead, copy
`.env.example` to `.env` and set:

| Variable | Description |
| --- | --- |
| `DISCORD_CLIENT_ID` | Your Discord Application's ID (required) |
| `DISCORD_LARGE_IMAGE_KEY` | Key of an art asset uploaded to your app, shown as the large icon (optional) |
| `DISCORD_LARGE_IMAGE_TEXT` | Tooltip text for that icon (optional) |

To create your own Discord Application:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   and create a new application.
2. Copy its **Application ID** into `DISCORD_CLIENT_ID`.
3. (Optional) Under **Rich Presence → Art Assets**, upload an image and use
   the name you gave it as `DISCORD_LARGE_IMAGE_KEY`.

## Contributing

Issues and PRs welcome — this is a small, single-purpose tool, so keep changes
focused. A few areas that could use help:

- A macOS/Linux equivalent of `start-hidden.vbs` (e.g. a `pm2`/`launchd`/
  `systemd` setup)
- Additional tool labels in `src/state.js`
- Support for more hook events / richer presence states

## License

MIT — see [LICENSE](LICENSE).
