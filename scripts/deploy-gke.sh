#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/gcp-env.sh"

if [[ -d "${ROOT_DIR}/tools/google-cloud-cli/bin" ]]; then
  export PATH="${ROOT_DIR}/tools/google-cloud-cli/bin:${PATH}"
fi

KUBECTL="${KUBECTL:-kubectl}"
if ! command -v "${KUBECTL}" >/dev/null 2>&1; then
  if [[ -x "${ROOT_DIR}/tools/bin/kubectl" ]]; then
    KUBECTL="${ROOT_DIR}/tools/bin/kubectl"
  else
    echo "kubectl introuvable. Installe kubectl ou place le binaire dans tools/bin/kubectl." >&2
    exit 1
  fi
fi

echo "=== Deploiement sur GKE ==="
echo "Project : ${PROJECT_ID}"
echo "Cluster : ${CLUSTER_NAME}"
echo "Location: ${CLUSTER_LOCATION_TYPE} ${CLUSTER_LOCATION}"

gcloud config set project "${PROJECT_ID}"
gcloud container clusters get-credentials "${CLUSTER_NAME}" "--${CLUSTER_LOCATION_TYPE}" "${CLUSTER_LOCATION}" --project "${PROJECT_ID}"

echo
echo "--- Application de la configuration et des secrets..."
"${KUBECTL}" apply -f "${ROOT_DIR}/k8s/secrets/secrets.yaml"
"${KUBECTL}" apply -f "${ROOT_DIR}/k8s/services/configmap.yaml"

echo
echo "--- Deploiement des services..."
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

for manifest in \
  auth-deployment.yaml \
  product-deployment.yaml \
  order-deployment.yaml \
  payment-deployment.yaml \
  gateway-deployment.yaml \
  frontend-deployment.yaml; do
  sed "s#europe-west1-docker.pkg.dev/ecommerce-mern-2026/ecommerce-repo#${REGISTRY}#g" \
    "${ROOT_DIR}/k8s/deployments/${manifest}" > "${TMP_DIR}/${manifest}"
  "${KUBECTL}" apply -f "${TMP_DIR}/${manifest}"
done

echo
echo "--- Configuration HPA et Ingress..."
"${KUBECTL}" apply -f "${ROOT_DIR}/k8s/hpa/hpa.yaml"
sed "s#ecommerce-ip#${STATIC_IP_NAME}#g" "${ROOT_DIR}/k8s/ingress/ingress.yaml" > "${TMP_DIR}/ingress.yaml"
"${KUBECTL}" apply -f "${TMP_DIR}/ingress.yaml"

echo
echo "--- Attente du rollout..."
"${KUBECTL}" rollout status deployment/auth-service --timeout=180s
"${KUBECTL}" rollout status deployment/product-service --timeout=180s
"${KUBECTL}" rollout status deployment/order-service --timeout=180s
"${KUBECTL}" rollout status deployment/payment-service --timeout=180s
"${KUBECTL}" rollout status deployment/api-gateway --timeout=180s
"${KUBECTL}" rollout status deployment/frontend --timeout=180s

echo
echo "--- Verification..."
"${KUBECTL}" get pods
"${KUBECTL}" get services
"${KUBECTL}" get hpa
"${KUBECTL}" get ingress

echo
echo "=== Deploiement termine ==="
echo "L'adresse publique peut prendre quelques minutes a apparaitre dans kubectl get ingress."
