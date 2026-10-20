Write-Host "=== Deploiement sur GKE ===" -ForegroundColor Green

# Appliquer les secrets
Write-Host "--- Application des secrets..." -ForegroundColor Yellow
kubectl apply -f k8s/secrets/secrets.yaml
kubectl apply -f k8s/services/configmap.yaml

# Appliquer les deployments
Write-Host "--- Deploiement des services..." -ForegroundColor Yellow
kubectl apply -f k8s/deployments/auth-deployment.yaml
kubectl apply -f k8s/deployments/product-deployment.yaml
kubectl apply -f k8s/deployments/order-deployment.yaml
kubectl apply -f k8s/deployments/payment-deployment.yaml
kubectl apply -f k8s/deployments/gateway-deployment.yaml
kubectl apply -f k8s/deployments/frontend-deployment.yaml

# Appliquer les HPA
Write-Host "--- Configuration HPA..." -ForegroundColor Yellow
kubectl apply -f k8s/hpa/hpa.yaml

# Appliquer l'Ingress
Write-Host "--- Configuration Ingress..." -ForegroundColor Yellow
kubectl apply -f k8s/ingress/ingress.yaml

# Verifier le deploiement
Write-Host "--- Verification..." -ForegroundColor Cyan
kubectl get pods
kubectl get services
kubectl get hpa
kubectl get ingress

Write-Host "=== Deploiement termine! ===" -ForegroundColor Green