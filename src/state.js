import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STATE_PATH = path.join(__dirname, "..", "state.json");

export function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function writeState(state) {
  const tmpPath = `${STATE_PATH}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  renameSync(tmpPath, STATE_PATH);
}

export const MODEL_LABELS = {
  "claude-opus-4-8": "Opus 4.8",
  "claude-sonnet-5": "Sonnet 5",
  "claude-fable-5": "Fable 5",
  "claude-haiku-4-5-20251001": "Haiku 4.5",
};

export function modelLabel(modelId) {
  if (!modelId) return "Claude";
  return MODEL_LABELS[modelId] ?? modelId;
}

export const TOOL_LABELS = {
  Read: "Reading files",
  Write: "Writing files",
  Edit: "Editing files",
  NotebookEdit: "Editing a notebook",
  Bash: "Running a command",
  Grep: "Searching code",
  Glob: "Searching files",
  WebFetch: "Fetching a webpage",
  WebSearch: "Searching the web",
  Agent: "Delegating to a subagent",
  TaskCreate: "Managing tasks",
  TaskUpdate: "Managing tasks",
};

export function toolLabel(toolName) {
  if (!toolName) return "Using a tool";
  return TOOL_LABELS[toolName] ?? `Using ${toolName}`;
}

export const PHASE_LABELS = {
  starting: "Starting up",
  thinking: "Currently thinking",
  tool: null, // filled in from toolName at render time
  waiting: "Waiting for input",
  ended: "Idle",
};
