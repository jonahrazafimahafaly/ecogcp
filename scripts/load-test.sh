#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://8.232.48.40}"
REQUESTS="${REQUESTS:-300}"
CONCURRENCY="${CONCURRENCY:-20}"

echo "Load test simple"
echo "URL         : ${BASE_URL}"
echo "Requests   : ${REQUESTS}"
echo "Concurrency: ${CONCURRENCY}"
echo

seq "${REQUESTS}" | xargs -P "${CONCURRENCY}" -I{} sh -c '
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" "$0/api/products?limit=12"
' "${BASE_URL}" | awk '
  {
    total += 1;
    if ($1 >= 200 && $1 < 400) ok += 1; else ko += 1;
    time += $2;
  }
  END {
    if (total == 0) total = 1;
    printf "Total: %d\nOK: %d\nErrors: %d\nAverage time: %.3fs\n", total, ok, ko, time / total;
  }
'
