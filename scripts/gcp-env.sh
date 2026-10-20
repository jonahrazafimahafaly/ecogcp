#!/usr/bin/env bash
set -euo pipefail

# Override these values before sourcing the file if your GCP setup differs.
export PROJECT_ID="${PROJECT_ID:-ecommerce-mern-2026}"
export REGION="${REGION:-europe-west1}"
export ZONE="${ZONE:-europe-west1-b}"
export CLUSTER_LOCATION_TYPE="${CLUSTER_LOCATION_TYPE:-region}"
export CLUSTER_LOCATION="${CLUSTER_LOCATION:-${REGION}}"
export REPOSITORY="${REPOSITORY:-ecommerce-repo}"
export CLUSTER_NAME="${CLUSTER_NAME:-ecommerce-cluster}"
export STATIC_IP_NAME="${STATIC_IP_NAME:-ecommerce-ip}"
export IMAGE_TAG="${IMAGE_TAG:-latest}"

export REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}"
