# Deploiement GCP / GKE

Ce projet est prepare pour etre deploye sur GKE avec Artifact Registry.

## Prerequis

- `gcloud`
- `docker`
- `kubectl`
- `gke-gcloud-auth-plugin`
- un projet GCP avec billing actif
- MongoDB Atlas accessible depuis GCP

Les valeurs par defaut sont dans `scripts/gcp-env.sh`:

- `PROJECT_ID=ecommerce-mern-2026`
- `REGION=europe-west1`
- `ZONE=europe-west1-b`
- `CLUSTER_LOCATION_TYPE=region`
- `CLUSTER_LOCATION=europe-west1`
- `REPOSITORY=ecommerce-repo`
- `CLUSTER_NAME=ecommerce-cluster`
- `STATIC_IP_NAME=ecommerce-ip`

## Commandes

```bash
gcloud auth login
gcloud auth application-default login
```

```bash
chmod +x scripts/*.sh
./scripts/bootstrap-gke.sh
./scripts/build-and-push.sh
./scripts/deploy-gke.sh
```

Si `kubectl` n'est pas installe globalement, le script utilise automatiquement `tools/bin/kubectl` quand ce fichier existe.
Si `gke-gcloud-auth-plugin` n'est pas installe globalement, le script utilise aussi `tools/google-cloud-cli/bin` quand le SDK local existe.

Si le cluster existe deja et les images sont deja poussees, il suffit normalement de recuperer les credentials puis de verifier:

```bash
gcloud container clusters get-credentials ecommerce-cluster --region europe-west1 --project ecommerce-mern-2026
./tools/bin/kubectl get pods
./tools/bin/kubectl get services
./tools/bin/kubectl get ingress
```

Pour changer un parametre:

```bash
PROJECT_ID=mon-projet-gcp ZONE=europe-west1-b ./scripts/bootstrap-gke.sh
PROJECT_ID=mon-projet-gcp ./scripts/build-and-push.sh
PROJECT_ID=mon-projet-gcp ./scripts/deploy-gke.sh
```

## Verifications

```bash
kubectl get pods
kubectl get services
kubectl get hpa
kubectl get ingress
kubectl describe ingress ecommerce-ingress
```

L'Ingress GCE peut prendre plusieurs minutes avant d'afficher une adresse publique.

## Notes importantes

- Le frontend est builde avec `VITE_API_URL=/` par defaut, afin que les appels `/api/...` passent par le meme domaine que le frontend.
- L'Ingress utilise l'adresse globale `ecommerce-ip`; elle est creee par `scripts/bootstrap-gke.sh`.
- Les manifests Kubernetes contiennent encore les anciennes images en dur, mais `scripts/deploy-gke.sh` les remplace au moment du deploiement avec le registry defini dans `scripts/gcp-env.sh`.
- Le fichier `k8s/secrets/secrets.yaml` contient des secrets en clair. Pour une vraie production, il faut remplacer ces valeurs et idealement utiliser Secret Manager ou External Secrets.
