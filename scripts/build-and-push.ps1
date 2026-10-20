$PROJECT_ID = "ecommerce-mern-2026"
$REGION = "europe-west1"
$REGISTRY = "$REGION-docker.pkg.dev/$PROJECT_ID/ecommerce-repo"
$TAG = "latest"

Write-Host "=== Build et push des images vers GCP ===" -ForegroundColor Green
Write-Host "Project  : $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Registry : $REGISTRY" -ForegroundColor Cyan

gcloud config set project $PROJECT_ID
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# Services backend
$services = @(
    @{ name = "auth-service";    path = "services/auth-service"    },
    @{ name = "product-service"; path = "services/product-service" },
    @{ name = "order-service";   path = "services/order-service"   },
    @{ name = "payment-service"; path = "services/payment-service" },
    @{ name = "api-gateway";     path = "api-gateway"              }
)

foreach ($service in $services) {
    $imageName = "$REGISTRY/$($service.name):$TAG"

    Write-Host ""
    Write-Host "--- Building $($service.name)..." -ForegroundColor Yellow
    docker build -t $imageName ./$($service.path)

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR build $($service.name)" -ForegroundColor Red
        exit 1
    }

    Write-Host "--- Pushing $($service.name)..." -ForegroundColor Yellow
    docker push $imageName

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR push $($service.name)" -ForegroundColor Red
        exit 1
    }

    Write-Host "OK $($service.name) pushed!" -ForegroundColor Green
}

# Frontend — build avec VITE_API_URL
Write-Host ""
Write-Host "--- Building frontend..." -ForegroundColor Yellow
$frontendImage = "$REGISTRY/frontend:$TAG"

# VITE_API_URL pointe vers le gateway sur GKE
# On utilisera l'IP publique après deployment
# Pour l'instant on met une valeur placeholder
$VITE_API_URL = "http://GATEWAY_IP_PLACEHOLDER"

docker build `
    --build-arg VITE_API_URL=$VITE_API_URL `
    -t $frontendImage `
    ./frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR build frontend" -ForegroundColor Red
    exit 1
}

Write-Host "--- Pushing frontend..." -ForegroundColor Yellow
docker push $frontendImage

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR push frontend" -ForegroundColor Red
    exit 1
}

Write-Host "OK frontend pushed!" -ForegroundColor Green
Write-Host ""
Write-Host "=== Toutes les images sont dans GCP Artifact Registry! ===" -ForegroundColor Green