import { execSync } from "node:child_process";
import path from "node:path";
import { readState, writeState } from "./state.js";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

function gitBranch(cwd) {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

async function main() {
  const raw = await readStdin();
  if (!raw) return;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const event = input.hook_event_name;
  const cwd = input.cwd;
  const prev = readState() ?? {};

  const next = { ...prev };
  next.sessionId = input.session_id ?? prev.sessionId ?? null;
  next.updatedAt = Date.now();

  if (cwd) {
    next.cwd = cwd;
    next.project = path.basename(cwd);
    next.branch = gitBranch(cwd);
  }

  switch (event) {
    case "SessionStart":
      next.model = input.model ?? prev.model ?? null;
      next.phase = "starting";
      next.toolName = null;
      next.startedAt = Date.now();
      break;
    case "UserPromptSubmit":
      next.phase = "thinking";
      next.toolName = null;
      break;
    case "PreToolUse":
      next.phase = "tool";
      next.toolName = input.tool_name ?? null;
      break;
    case "PostToolUse":
    case "PostToolUseFailure":
      next.phase = "thinking";
      next.toolName = null;
      break;
    case "Stop":
    case "SubagentStop":
      next.phase = "waiting";
      next.toolName = null;
      break;
    case "Notification":
      if (input.type === "idle_prompt") {
        next.phase = "waiting";
      }
      break;
    case "SessionEnd":
      next.phase = "ended";
      next.toolName = null;
      break;
    default:
      // Unhandled event: keep prior phase, just refresh cwd/project/branch/timestamp.
      break;
  }

  writeState(next);
}

main();
