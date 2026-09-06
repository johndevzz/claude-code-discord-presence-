#!/usr/bin/env bash
# macOS/Linux equivalent of start-hidden.vbs: launches the daemon detached
# from the current terminal, so you can close the terminal and it keeps
# running in the background. All it does is `cd` into this script's own
# folder and run `node src/daemon.js` — read below if you want to verify
# that yourself before running it.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1
nohup node src/daemon.js > /dev/null 2>&1 &
disown
echo "Daemon started in the background (pid $!)."
