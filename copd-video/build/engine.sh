#!/usr/bin/env bash
# VOICEVOX エンジンを（必要なら dockerd ごと）起動し、応答するまで待つ。何度実行してもよい。
# 使い方: bash build/engine.sh
set -euo pipefail
IMAGE="voicevox/voicevox_engine:cpu-0.26.0"
URL="${VOICEVOX_URL:-http://127.0.0.1:50021}"

if curl -fsS -m 3 "$URL/version" >/dev/null 2>&1; then
  echo "VOICEVOX already running: $(curl -s "$URL/version")"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "starting dockerd..."
  (nohup dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 1; done
  docker info >/dev/null 2>&1 || { echo "dockerd did not start (see /tmp/dockerd.log)" >&2; exit 1; }
fi

docker image inspect "$IMAGE" >/dev/null 2>&1 || docker pull -q "$IMAGE"
docker rm -f voicevox >/dev/null 2>&1 || true
docker run -d --name voicevox -p 127.0.0.1:50021:50021 "$IMAGE" >/dev/null

for _ in $(seq 1 120); do
  if curl -fsS -m 3 "$URL/version" >/dev/null 2>&1; then
    echo "VOICEVOX ready: $(curl -s "$URL/version")"
    exit 0
  fi
  sleep 2
done
echo "VOICEVOX did not become ready" >&2
docker logs --tail 30 voicevox >&2 || true
exit 1
