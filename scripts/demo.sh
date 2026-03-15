#!/usr/bin/env sh

set -eu

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Creating demo task..."
TASK_RESPONSE="$(curl -sS -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}')"

echo "$TASK_RESPONSE"

TASK_ID="$(printf '%s' "$TASK_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"

if [ -z "$TASK_ID" ]; then
  echo "Could not extract task id from response."
  exit 1
fi

echo
echo "Fetching task..."
curl -sS "$BASE_URL/tasks/$TASK_ID"

echo
echo
echo "Fetching task events..."
curl -sS "$BASE_URL/tasks/$TASK_ID/events"
