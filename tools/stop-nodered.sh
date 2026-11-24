#!/bin/sh
# Node-RED renames its process to "node-red", so stop it by the port it listens on.
PID=$(lsof -tiTCP:1880 -sTCP:LISTEN)
[ -n "$PID" ] && kill $PID
i=0; while lsof -tiTCP:1880 -sTCP:LISTEN >/dev/null 2>&1 && [ $i -lt 50 ]; do sleep 0.2; i=$((i+1)); done
lsof -tiTCP:1880 -sTCP:LISTEN >/dev/null 2>&1 && echo "port 1880 still busy" || echo "port 1880 free"
