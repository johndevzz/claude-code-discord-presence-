import "dotenv/config";
import { Client } from "@xhayper/discord-rpc";
import chokidar from "chokidar";
import { readState, STATE_PATH, modelLabel, toolLabel, PHASE_LABELS } from "./state.js";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
if (!CLIENT_ID) {
  console.error("DISCORD_CLIENT_ID is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const LARGE_IMAGE_KEY = process.env.DISCORD_LARGE_IMAGE_KEY || undefined;
const LARGE_IMAGE_TEXT = process.env.DISCORD_LARGE_IMAGE_TEXT || "Claude Code";

const STALE_MS = 10 * 60 * 1000; // clear presence if state hasn't updated in 10 minutes

const client = new Client({ clientId: CLIENT_ID });
let ready = false;
let cleared = true;

function buildActivity(state) {
  if (!state || state.phase === "ended") return null;
  if (Date.now() - (state.updatedAt ?? 0) > STALE_MS) return null;

  const details = state.project
    ? `Working on ${state.project}${state.branch ? ` (${state.branch})` : ""}`
    : "Working";

  const phaseText = state.phase === "tool" ? toolLabel(state.toolName) : PHASE_LABELS[state.phase] ?? "Idle";

  return {
    details,
    state: `${phaseText} · Using ${modelLabel(state.model)}`,
    startTimestamp: state.startedAt ? new Date(state.startedAt) : undefined,
    largeImageKey: LARGE_IMAGE_KEY,
    largeImageText: LARGE_IMAGE_TEXT,
    instance: false,
  };
}

async function pushPresence() {
  if (!ready) return;
  const state = readState();
  const activity = buildActivity(state);

  if (!activity) {
    if (!cleared) {
      await client.user?.clearActivity();
      cleared = true;
      console.log("Cleared presence (no active session)");
    }
    return;
  }

  cleared = false;
  await client.user?.setActivity(activity);
  console.log("Presence updated:", activity.details, "|", activity.state);
}

client.on("ready", () => {
  ready = true;
  console.log(`Connected to Discord as ${client.user?.username}`);
  pushPresence();
});

client.on("disconnected", () => {
  ready = false;
  console.log("Disconnected from Discord, will retry...");
});

function connectWithRetry() {
  client.login().catch((err) => {
    console.log("Discord not available yet, retrying in 15s:", err.message);
    setTimeout(connectWithRetry, 15000);
  });
}

connectWithRetry();

chokidar.watch(STATE_PATH).on("change", pushPresence).on("add", pushPresence);

// Periodic refresh: keeps the elapsed timer alive and catches staleness even
// when no new hook events fire (e.g. the user closed the terminal).
setInterval(pushPresence, 30000);
