#!/bin/bash

# Test script for OpenRouter API. Requires OPENROUTER_API_KEY in dev/.env (see .env.example).
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "Error: OPENROUTER_API_KEY not set. Copy dev/.env.example to dev/.env and set the key." >&2
  exit 1
fi

curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
  "model": "z-ai/glm-4.5-air:free",
  "messages": [
      {
        "role": "user",
        "content": "What is the meaning of life?"
      }
    ]
}'
