#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/gcp-env.sh"

# Same-origin API calls work behind the GCE Ingress because /api is routed to the gateway.
FRONTEND_API_URL="${FRONTEND_API_URL:-/}"

echo "=== Build et push des images vers GCP Artifact Registry ==="
echo "Project  : ${PROJECT_ID}"
echo "Registry : ${REGISTRY}"
echo "Tag      : ${IMAGE_TAG}"

gcloud config set project "${PROJECT_ID}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

services=(
  "auth-service:services/auth-service"
  "product-service:services/product-service"
  "order-service:services/order-service"
  "payment-service:services/payment-service"
  "api-gateway:api-gateway"
)

for entry in "${services[@]}"; do
  name="${entry%%:*}"
  path="${entry#*:}"
  image="${REGISTRY}/${name}:${IMAGE_TAG}"

  echo
  echo "--- Building ${name}..."
  docker build -t "${image}" "${ROOT_DIR}/${path}"

  echo "--- Pushing ${name}..."
  docker push "${image}"
done

frontend_image="${REGISTRY}/frontend:${IMAGE_TAG}"
echo
echo "--- Building frontend with VITE_API_URL=${FRONTEND_API_URL}..."
docker build \
  --build-arg "VITE_API_URL=${FRONTEND_API_URL}" \
  -t "${frontend_image}" \
  "${ROOT_DIR}/frontend"

echo "--- Pushing frontend..."
docker push "${frontend_image}"

echo
echo "=== Toutes les images sont disponibles dans Artifact Registry ==="
