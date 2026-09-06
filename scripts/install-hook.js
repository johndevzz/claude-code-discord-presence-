#!/usr/bin/env node
// Registers (or removes, with --uninstall) the Claude Code hooks that feed
// this daemon, by merging them into the user's ~/.claude/settings.json.
// Safe to re-run: it never touches hooks it didn't add itself.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDLER_PATH = path.resolve(__dirname, "..", "src", "hookHandler.js");
const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");

const EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "Stop",
  "SubagentStop",
  "Notification",
  "SessionEnd",
];

const uninstall = process.argv.includes("--uninstall");

function loadSettings() {
  if (!existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
  } catch (err) {
    console.error(`Could not parse ${SETTINGS_PATH}: ${err.message}`);
    process.exit(1);
  }
}

function isOurHookGroup(group) {
  return Boolean(
    group.hooks?.some(
      (h) => h.command === "node" && h.args?.some((a) => path.resolve(a) === HANDLER_PATH)
    )
  );
}

function main() {
  const settings = loadSettings();
  settings.hooks = settings.hooks ?? {};
  let changed = false;

  for (const event of EVENTS) {
    const groups = settings.hooks[event] ?? [];
    const withoutOurs = groups.filter((g) => !isOurHookGroup(g));

    if (uninstall) {
      if (withoutOurs.length !== groups.length) {
        settings.hooks[event] = withoutOurs;
        changed = true;
      }
      continue;
    }

    if (withoutOurs.length === groups.length) {
      settings.hooks[event] = [
        ...groups,
        {
          hooks: [
            { type: "command", command: "node", args: [HANDLER_PATH], timeout: 5, async: true },
          ],
        },
      ];
      changed = true;
    }
  }

  if (uninstall) {
    for (const event of EVENTS) {
      if (settings.hooks[event]?.length === 0) delete settings.hooks[event];
    }
  }

  if (!changed) {
    console.log(
      uninstall
        ? "No Discord presence hooks found — nothing to remove."
        : "Discord presence hooks are already installed — nothing to do."
    );
    return;
  }

  mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
  console.log(
    uninstall
      ? `Removed Discord presence hooks from ${SETTINGS_PATH}`
      : `Installed Discord presence hooks into ${SETTINGS_PATH}`
  );
}

main();
