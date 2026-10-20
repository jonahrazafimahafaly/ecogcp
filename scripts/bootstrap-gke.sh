#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/gcp-env.sh"

MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
NUM_NODES="${NUM_NODES:-2}"

echo "=== Preparation GCP pour le deploiement GKE ==="
echo "Project    : ${PROJECT_ID}"
echo "Region     : ${REGION}"
echo "Location   : ${CLUSTER_LOCATION_TYPE} ${CLUSTER_LOCATION}"
echo "Repository : ${REPOSITORY}"
echo "Cluster    : ${CLUSTER_NAME}"

gcloud config set project "${PROJECT_ID}"

echo
echo "--- Activation des APIs necessaires..."
gcloud services enable \
  artifactregistry.googleapis.com \
  container.googleapis.com \
  compute.googleapis.com

echo
echo "--- Creation du repository Artifact Registry si absent..."
if ! gcloud artifacts repositories describe "${REPOSITORY}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPOSITORY}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Images Docker ecommerce MERN"
else
  echo "Repository deja existant."
fi

echo
echo "--- Reservation de l'adresse IP globale si absente..."
if ! gcloud compute addresses describe "${STATIC_IP_NAME}" --global >/dev/null 2>&1; then
  gcloud compute addresses create "${STATIC_IP_NAME}" --global
else
  echo "Adresse IP globale deja existante."
fi

echo
echo "--- Creation du cluster GKE si absent..."
if ! gcloud container clusters describe "${CLUSTER_NAME}" "--${CLUSTER_LOCATION_TYPE}"="${CLUSTER_LOCATION}" >/dev/null 2>&1; then
  gcloud container clusters create "${CLUSTER_NAME}" \
    "--${CLUSTER_LOCATION_TYPE}"="${CLUSTER_LOCATION}" \
    --num-nodes="${NUM_NODES}" \
    --machine-type="${MACHINE_TYPE}" \
    --enable-ip-alias \
    --scopes="https://www.googleapis.com/auth/cloud-platform"
else
  echo "Cluster deja existant."
fi

echo
echo "--- Recuperation des credentials Kubernetes..."
gcloud container clusters get-credentials "${CLUSTER_NAME}" "--${CLUSTER_LOCATION_TYPE}" "${CLUSTER_LOCATION}" --project "${PROJECT_ID}"

echo
echo "=== Preparation terminee ==="
