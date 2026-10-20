# Demonstration du projet MERN microservices sur GCP / GKE

Ce document sert de support pour presenter le projet, expliquer les configurations, et faire les simulations devant le professeur.

## 1. Objectif du projet

Le projet est une application e-commerce MERN deployee en architecture microservices sur Google Cloud Platform.

Objectifs techniques:

- separer les responsabilites en plusieurs services independants;
- conteneuriser chaque service avec Docker;
- deployer les conteneurs sur Kubernetes avec GKE;
- exposer l'application avec un Ingress public;
- utiliser l'autoscaling horizontal avec HPA;
- stocker les variables de configuration dans ConfigMap et Secret;
- superviser l'etat du cluster avec `kubectl`.

## 2. Architecture generale

Services applicatifs:

- `frontend`: interface React/Vite servie par Nginx;
- `api-gateway`: point d'entree backend, route les requetes `/api/...`;
- `auth-service`: authentification et utilisateurs;
- `product-service`: produits et categories;
- `order-service`: commandes;
- `payment-service`: paiements.

Flux principal:

```text
Utilisateur
  -> Ingress GCE public
  -> frontend pour /
  -> api-gateway pour /api
  -> microservices internes Kubernetes
  -> MongoDB Atlas
```

Adresse publique actuelle:

```text
http://8.232.48.40
```

## 3. Fichiers Kubernetes importants

### Deployments

Dossier:

```bash
k8s/deployments/
```

Chaque fichier de deployment cree:

- un `Deployment` Kubernetes;
- deux replicas par service;
- les ressources CPU/memoire;
- les probes `livenessProbe` et `readinessProbe`;
- un `Service` Kubernetes pour exposer le pod dans le cluster.

Exemple a expliquer dans `auth-deployment.yaml`:

- `replicas: 2`: deux pods pour la haute disponibilite;
- `image`: image Docker stockee dans Artifact Registry;
- `envFrom.secretRef`: charge les secrets;
- `envFrom.configMapRef`: charge les variables non sensibles;
- `livenessProbe`: verifie si le conteneur est vivant;
- `readinessProbe`: verifie si le pod peut recevoir du trafic.

### ConfigMap

Fichier:

```bash
k8s/services/configmap.yaml
```

Role:

- stocker les variables non sensibles;
- definir les ports;
- definir les URLs internes entre microservices.

Exemples:

```text
AUTH_SERVICE_URL=http://auth-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
FRONTEND_URL=http://8.232.48.40
```

### Secrets

Fichier:

```bash
k8s/secrets/secrets.yaml
```

Role:

- stocker les donnees sensibles;
- exemple: `MONGO_URI`, `JWT_SECRET`, `GATEWAY_SECRET`.

Phrase importante pour l'oral:

```text
Dans une vraie production, il vaut mieux utiliser Google Secret Manager ou External Secrets au lieu de garder les secrets en clair dans Git.
```

### Ingress

Fichier:

```bash
k8s/ingress/ingress.yaml
```

Role:

- exposer l'application sur Internet;
- router `/` vers le frontend;
- router `/api` et `/health` vers l'api-gateway;
- utiliser une IP statique GCP: `ecommerce-ip`.

Routage:

```text
/       -> frontend:80
/api    -> api-gateway:3000
/health -> api-gateway:3000
```

### HPA

Fichier:

```bash
k8s/hpa/hpa.yaml
```

Role:

- ajuster automatiquement le nombre de pods selon CPU et memoire;
- garder au minimum 2 replicas;
- monter jusqu'a 8, 10 ou 15 pods selon le service.

Exemple:

```text
api-gateway-hpa: min 2, max 15, cible CPU 60%, memoire 75%
auth-service-hpa: min 2, max 10, cible CPU 70%, memoire 80%
```

## 4. Commandes de preparation

Se connecter au bon compte GCP:

```bash
gcloud auth login
gcloud config set project ecommerce-mern-2026
```

Recuperer l'acces au cluster GKE regional:

```bash
gcloud container clusters get-credentials ecommerce-cluster --region europe-west1 --project ecommerce-mern-2026
```

Si le plugin GKE local du projet est necessaire:

```bash
export PATH="$PWD/tools/google-cloud-cli/bin:$PATH"
```

Ou utiliser directement le raccourci du projet:

```bash
./scripts/kubectl-gke.sh get pods
```

Verifier le contexte Kubernetes:

```bash
kubectl config current-context
```

Resultat attendu:

```text
gke_ecommerce-mern-2026_europe-west1_ecommerce-cluster
```

## 5. Commandes de demonstration

### Voir les pods

```bash
kubectl get pods
```

Ce qu'il faut expliquer:

- chaque microservice tourne dans des pods;
- `READY 1/1` signifie que le conteneur est pret;
- `Running` signifie que le pod fonctionne;
- deux pods par service montrent la haute disponibilite.

### Voir les services

```bash
kubectl get services
```

Ce qu'il faut expliquer:

- les services `ClusterIP` sont internes au cluster;
- `frontend` et `api-gateway` sont en `NodePort` car ils sont relies a l'Ingress;
- les microservices communiquent entre eux par DNS Kubernetes, par exemple `auth-service:3001`.

### Voir l'Ingress

```bash
kubectl get ingress
```

Resultat attendu:

```text
ecommerce-ingress   ADDRESS 8.232.48.40
```

Tester l'application:

```bash
curl -I http://8.232.48.40/health
```

Resultat attendu:

```text
HTTP/1.1 200 OK
```

### Voir l'autoscaling

```bash
kubectl get hpa
```

Ce qu'il faut expliquer:

- `TARGETS` montre l'utilisation CPU/memoire actuelle;
- `MINPODS` et `MAXPODS` montrent les limites d'autoscaling;
- `REPLICAS` montre le nombre actuel de pods.

### Voir les ressources consommees

```bash
kubectl top pods
```

Ce qu'il faut expliquer:

- cette commande affiche CPU et memoire par pod;
- HPA utilise ces metriques pour decider si le service doit scaler.

### Details d'un deployment

```bash
kubectl describe deployment auth-service
```

Points a montrer:

- image Docker utilisee;
- replicas souhaites et disponibles;
- variables chargees depuis Secret et ConfigMap;
- probes;
- events Kubernetes.

### Logs d'un service

```bash
kubectl logs deployment/api-gateway --tail=50
```

Ce qu'il faut expliquer:

- les logs permettent de verifier les requetes entrantes;
- l'api-gateway centralise le trafic backend.

## 6. Simulations possibles

### Simulation 1: verifier la haute disponibilite

Afficher les pods:

```bash
kubectl get pods
```

Supprimer un pod frontend:

```bash
kubectl delete pod -l app=frontend
```

Observer Kubernetes recreer les pods:

```bash
kubectl get pods -w
```

Explication:

```text
Le Deployment maintient toujours le nombre de replicas demande. Si un pod tombe, Kubernetes le remplace automatiquement.
```

Attention: cette commande supprime tous les pods frontend actuels, mais le Deployment les recree.

### Simulation 2: scaler manuellement un service

Passer `product-service` a 4 replicas:

```bash
kubectl scale deployment product-service --replicas=4
kubectl get pods -l app=product-service
```

Revenir a 2 replicas:

```bash
kubectl scale deployment product-service --replicas=2
kubectl get pods -l app=product-service
```

Explication:

```text
Kubernetes permet d'ajuster le nombre de pods selon le besoin. En production, HPA peut le faire automatiquement selon CPU et memoire.
```

### Simulation 3: observer HPA

Afficher HPA en continu:

```bash
kubectl get hpa -w
```

Dans un autre terminal, lancer un test de charge si `k6` est installe:

```bash
k6 run -e BASE_URL=http://8.232.48.40 scripts/benchmark.js
```

Si `k6` n'est pas installe:

```bash
sudo snap install k6
```

Alternative simple sans `k6`, fournie dans le projet:

```bash
./scripts/load-test.sh
```

Ou en personnalisant la charge:

```bash
REQUESTS=1000 CONCURRENCY=50 ./scripts/load-test.sh
```

Alternative minimale sans script:

```bash
for i in {1..100}; do curl -s http://8.232.48.40/api/products?limit=12 >/dev/null; done
```

Explication:

```text
Sous charge, l'utilisation CPU/memoire peut augmenter. Si les seuils sont depasses, HPA augmente le nombre de replicas.
```

### Simulation 4: verifier le routage Ingress

Tester le frontend:

```bash
curl -I http://8.232.48.40/
```

Tester le gateway:

```bash
curl -I http://8.232.48.40/health
```

Tester une API:

```bash
curl http://8.232.48.40/api/products?limit=3
```

Explication:

```text
L'Ingress route automatiquement le trafic selon le chemin: frontend pour /, api-gateway pour /api.
```

## 7. Commandes de deploiement

Si les images et le cluster existent deja, il suffit d'appliquer les manifests:

```bash
./scripts/deploy-gke.sh
```

Si on doit reconstruire les images:

```bash
./scripts/build-and-push.sh
./scripts/deploy-gke.sh
```

Si on doit creer l'infrastructure depuis zero:

```bash
./scripts/bootstrap-gke.sh
./scripts/build-and-push.sh
./scripts/deploy-gke.sh
```

Pour cette demonstration, le cluster existe deja, donc il ne faut normalement pas relancer `bootstrap-gke.sh`.

## 8. Etat actuel observe

Derniere verification:

```text
Ingress public: http://8.232.48.40
Health check: HTTP/1.1 200 OK
Pods: tous les services sont Running
HPA: actifs sur api-gateway, auth, product, order et payment
```

Exemple d'HPA observe:

```text
api-gateway-hpa       cpu: 4%/60%, memory: 13%/75%, replicas: 2
auth-service-hpa      cpu: 3%/70%, memory: 30%/80%, replicas: 2
product-service-hpa   cpu: 3%/70%, memory: 39%/80%, replicas: 2
```

## 9. Questions possibles du professeur

### Pourquoi utiliser des microservices?

Pour separer les responsabilites, deployer les services independamment, faciliter le scaling et isoler les pannes.

### Pourquoi utiliser un API Gateway?

Pour avoir un point d'entree unique vers le backend, appliquer les middlewares communs, limiter le trafic et router vers les bons services.

### Pourquoi utiliser Kubernetes?

Pour orchestrer les conteneurs, gerer les replicas, redemarrer automatiquement les pods, exposer les services et automatiser le scaling.

### Pourquoi utiliser HPA?

Pour adapter automatiquement le nombre de pods selon la charge CPU et memoire.

### Pourquoi utiliser ConfigMap et Secret?

ConfigMap stocke les configurations non sensibles. Secret stocke les valeurs sensibles comme les tokens et URI de base de donnees.

### Pourquoi utiliser Ingress?

Pour exposer l'application avec une seule IP publique et router le trafic HTTP vers les bons services Kubernetes.

## 10. Script oral court

```text
Ce projet est une application e-commerce MERN deployee sur GCP avec GKE.
L'application est divisee en microservices: frontend, gateway, auth, product, order et payment.
Chaque service est conteneurise avec Docker et deployee dans Kubernetes avec deux replicas.
L'Ingress expose l'application publiquement sur l'IP 8.232.48.40.
Les routes / vont vers le frontend, tandis que /api passe par l'api-gateway.
Les configurations sont separees entre ConfigMap pour les variables non sensibles et Secret pour les valeurs sensibles.
HPA permet l'autoscaling automatique selon CPU et memoire.
Avec kubectl, on peut verifier les pods, services, ingress, logs, metriques et simuler la resilience ou le scaling.
```
