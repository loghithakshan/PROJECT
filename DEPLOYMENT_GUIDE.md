# ResilientEcho - Deployment & Operations Guide

**Quick Reference**: https://kubernetes.io/docs/

---

## 🚀 Pre-Deployment Checklist

### Development Environment (Local)
```bash
# Requirements
- Node.js 18.20.4+ (https://nodejs.org)
- Docker Desktop 4.30+ (https://docker.com/products/docker-desktop)
- kubectl 1.30+ (https://kubernetes.io/docs/tasks/tools/)
- Git 2.40+ (https://git-scm.com)

# Verify installation
node --version        # v18.20.4 or higher
npm --version         # v10.5.0 or higher
docker --version      # Docker version 4.30.x
kubectl version       # Client version 1.30+
```

### Production Prerequisites
- Kubernetes cluster (EKS, AKS, or GKE)
- Container registry (ECR, ACR, or GCR)
- PostgreSQL 16+ database (managed or self-hosted)
- Redis 7+ cache (managed or self-hosted)
- Domain name with TLS certificate
- CI/CD pipeline (GitHub Actions configured)

---

## 📦 Step 1: Local Development Setup

### 1.1 Clone Repository
```bash
git clone https://github.com/resilientercho/backend.git
cd backend
```

### 1.2 Install Dependencies
```bash
# Install monorepo dependencies
npm install

# Verify Yarn Workspaces
npm list --depth=0
# Output should show: packages/ and apps/api packages
```

### 1.3 Initialize Environment
```bash
# Create .env file in root
cat > .env << 'EOF'
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<base64-256bit-key>
JWT_REFRESH_SECRET=<base64-256bit-key>

# Database (docker-compose provides)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resilientercho
REDIS_HOST=localhost
REDIS_PORT=6379

# API Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Translation API
DEEPL_API_KEY=<your-deepl-api-key>  # Use Google Translate fallback if empty
EOF
```

### 1.4 Start Docker Services
```bash
# Start PostgreSQL, Redis, and pgAdmin
docker-compose up -d

# Verify services
docker-compose ps
# Expected output:
# - postgres (port 5432, status: running)
# - redis (port 6379, status: running)
# - timescaledb (port 5433, status: running)
# - pgadmin (port 5050, status: running)

# View logs
docker-compose logs -f postgres
```

### 1.5 Initialize Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Verify database (open pgAdmin)
# http://localhost:5050
# Login: admin@example.com / admin
# Add connection to postgres:5432 (password: postgres)
```

### 1.6 Start Development Server
```bash
# Option A: Development with hot-reload
npm run start:dev

# Option B: Production build
npm run build
npm start

# Option C: Watch mode (individual package)
cd apps/api && npm run start:dev

# API available at http://localhost:3001
# Swagger docs at http://localhost:3001/api/docs
```

### 1.7 Verify Installation
```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# { "status": "ok", "timestamp": "2026-03-02T..." }

# View logs
docker-compose logs -f resilientercho-api  # If running with docker-compose
```

---

## 🐳 Step 2: Docker Build & Local Testing

### 2.1 Build Docker Image
```bash
# Build image
docker build -f apps/api/Dockerfile -t resilientercho:latest .

# Verify image
docker images | grep resilientercho
# Output: resilientercho | latest | <image-id> | <size>
```

### 2.2 Run Image Locally
```bash
# Run container (requires database running in docker-compose)
docker run -p 3001:3001 \
  -e NODE_ENV=development \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/resilientercho \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6379 \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  resilientercho:latest

# Alternatively, add to docker-compose.yml and run
docker-compose up -d
```

### 2.3 Test Container
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"publicKeyEd25519":"abc123...", "email":"user@test.io"}'
```

---

## ☸️ Step 3: Kubernetes Deployment

### 3.1 Setup Cluster
```bash
# AWS EKS Example
aws eks create-cluster \
  --name resilientercho \
  --version 1.30 \
  --role-arn arn:aws:iam::ACCOUNT:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-123,subnet-456

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name resilientercho

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 3.2 Push Image to Registry
```bash
# AWS ECR Example
AWS_ACCOUNT=123456789012
AWS_REGION=us-east-1
ECR_REPO=resilientercho

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push
docker build -f apps/api/Dockerfile -t $ECR_REPO:v1.0.0 .
docker tag $ECR_REPO:v1.0.0 $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v1.0.0
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:v1.0.0
```

### 3.3 Create Secrets
```bash
# Create PostgreSQL secret
kubectl create secret generic resilientercho-db-secret \
  --from-literal=url=postgresql://user:password@db.example.com:5432/resilientercho \
  --namespace resilientercho

# Create Redis secret
kubectl create secret generic resilientercho-redis-secret \
  --from-literal=host=redis.example.com \
  --from-literal=port=6379 \
  --namespace resilientercho

# Create JWT secret
JWT_SECRET=$(openssl rand -base64 32)
kubectl create secret generic resilientercho-jwt-secret \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --namespace resilientercho
```

### 3.4 Update Kubernetes Manifests
```bash
# Edit k8s/deployment.yaml
# Update image reference to your ECR registry
sed -i 's|DOCKER_REGISTRY|'$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com'|g' k8s/deployment.yaml

# Verify changes
grep "image:" k8s/deployment.yaml
```

### 3.5 Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace resilientercho

# Apply manifests
kubectl apply -f k8s/deployment.yaml --namespace resilientercho

# Verify deployment
kubectl get deployments -n resilientercho
kubectl get pods -n resilientercho
kubectl get svc -n resilientercho

# Wait for rollout
kubectl rollout status deployment/resilientercho-api -n resilientercho
```

### 3.6 Verify Deployment
```bash
# Check pod status
kubectl get pods -n resilientercho -w
# Watch until all pods show "Ready 1/1" and "Running"

# View logs
kubectl logs -l app=resilientercho-api -n resilientercho -f

# Test endpoint (via LoadBalancer IP)
EXTERNAL_IP=$(kubectl get svc resilientercho-api -n resilientercho -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$EXTERNAL_IP/health
```

---

## 🔄 Step 4: CI/CD Setup

### 4.1 Configure GitHub Repository Secrets
```bash
# In GitHub: Settings → Secrets and variables → Actions

DOCKER_REGISTRY=<aws-account>.dkr.ecr.<region>.amazonaws.com
DOCKER_REGISTRY_USER=AWS
DOCKER_REGISTRY_PASSWORD=<aws-ecr-token>  # Use: aws ecr get-login-password
KUBECONFIG=<base64-encoded-kubeconfig>    # Use: cat ~/.kube/config | base64
```

### 4.2 Verify CI/CD Pipeline
```bash
# Push to main branch
git checkout main
git push origin main

# Monitor pipeline
# GitHub → Actions → Latest workflow run
# Should show: Test job ✓ → Build job ✓ → Deploy job ✓
```

### 4.3 Monitor Deployment
```bash
# Watch rollout
kubectl rollout status deployment/resilientercho-api -n resilientercho -w

# View events
kubectl describe deployment resilientercho-api -n resilientercho
```

---

## 📊 Step 5: Monitoring & Observability

### 5.1 Setup Prometheus
```bash
# Install Prometheus via Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus -n resilientercho

# Port forward
kubectl port-forward -n resilientercho svc/prometheus-server 9090:80

# Access at http://localhost:9090
```

### 5.2 Setup Grafana
```bash
# Install Grafana via Helm
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana -n resilientercho

# Get admin password
kubectl get secret -n resilientercho grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward
kubectl port-forward -n resilientercho svc/grafana 3000:80

# Access at http://localhost:3000
# Add Prometheus data source: http://prometheus-server:80
```

### 5.3 Setup ELK Stack (Logs)
```bash
# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch -n resilientercho

# Install Kibana
helm install kibana elastic/kibana -n resilientercho

# Configure Filebeat to collect pod logs
kubectl apply -f - << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: resilientercho
data:
  filebeat.yml: |
    filebeat.autodiscover:
      providers:
        - type: kubernetes
          node: ${NODE_NAME}
          hints.enabled: true
          hints.default_dashboards_enabled: true
output.elasticsearch:
      hosts: ["elasticsearch:9200"]
EOF

# Deploy Filebeat
helm install filebeat elastic/filebeat -n resilientercho
```

### 5.4 View Logs
```bash
# Real-time pod logs
kubectl logs -l app=resilientercho-api -n resilientercho -f

# Previous logs
kubectl logs -l app=resilientercho-api -n resilientercho --previous

# Logs from specific pod
kubectl logs <pod-name> -n resilientercho

# Filter logs
kubectl logs -l app=resilientercho-api -n resilientercho | grep ERROR
```

---

## 🔒 Step 6: Security Hardening

### 6.1 Network Security
```bash
# Verify NetworkPolicy is applied
kubectl get networkpolicy -n resilientercho

# Test connectivity (should deny external)
kubectl run test-pod --image=curlimages/curl -i --tty --rm -- sh
# Inside pod: curl http://resilientercho-api:3001/health (should work)
# But traffic to external IPs should fail
```

### 6.2 Secret Rotation
```bash
# Update JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 32)
kubectl patch secret resilientercho-jwt-secret \
  -p '{"data":{"jwt-secret":"'$(echo -n $NEW_JWT_SECRET | base64)'"}}' \
  -n resilientercho

# Trigger pod restart
kubectl rollout restart deployment/resilientercho-api -n resilientercho
```

### 6.3 Pod Security Policy
```bash
# Apply Pod Security Standards
kubectl label namespace resilientercho pod-security.kubernetes.io/enforce=restricted

# Verify
kubectl describe namespace resilientercho
```

---

## 🧪 Step 7: Testing

### 7.1 Unit Tests
```bash
# Run unit tests
npm run test

# Coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

### 7.2 E2E Tests
```bash
# Run full workflow test
npm run test:e2e

# Specific test file
npm run test:e2e -- auth.e2e-spec.ts
```

### 7.3 Load Testing
```bash
# Install k6
brew install k6

# Run load test
k6 run test/load-test.js

# With custom scaling
k6 run -u 100 -d 5m test/load-test.js
# (100 concurrent users, 5 minute duration)
```

### 7.4 Security Testing
```bash
# OWASP Dependency Check
npm audit

# Fix vulnerabilities
npm audit fix
npm audit fix --force

# Code scanning (if using GitHub)
# GitHub → Security → Code scanning → Enable CodeQL
```

---

## 📈 Step 8: Scaling & Performance Tuning

### 8.1 Horizontal Scaling
```bash
# Current HPA configuration (in k8s/deployment.yaml)
# - Min replicas: 3
# - Max replicas: 10
# - CPU trigger: 70%
# - Memory trigger: 80%

# Monitor HPA
kubectl get hpa -n resilientercho -w

# Manual scaling (for testing)
kubectl scale deployment resilientercho-api --replicas=5 -n resilientercho
```

### 8.2 Resource Optimization
```bash
# Check current resource usage
kubectl top pods -n resilientercho
kubectl top nodes

# Adjust resource limits (in k8s/deployment.yaml)
# resources:
#   requests:
#     memory: "256Mi"
#     cpu: "250m"
#   limits:
#     memory: "512Mi"
#     cpu: "500m"

# Apply changes
kubectl apply -f k8s/deployment.yaml
```

### 8.3 Database Performance
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d resilientercho

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM alerts WHERE created_at > now() - interval '24 hours';

# Create indexes (if not already created by Prisma)
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_geom ON alerts USING GIST(geom);
```

---

## 🔧 Step 9: Troubleshooting

### 9.1 Pod Not Starting
```bash
# Describe pod for events
kubectl describe pod <pod-name> -n resilientercho

# Check pod logs
kubectl logs <pod-name> -n resilientercho

# Common issues:
# - ImagePullBackOff: Verify ECR credentials
# - CrashLoopBackOff: Check application logs
# - Pending: Insufficient resources (check node status)
```

### 9.2 Database Connection Issues
```bash
# Verify secret values
kubectl get secret resilientercho-db-secret -n resilientercho -o yaml

# Test connectivity from pod
kubectl run debug --image=postgres:16 -i --tty --rm -- \
  psql -h resilientercho-db.example.com -U postgres -d resilientercho
```

### 9.3 High Resource Usage
```bash
# Identify resource-heavy pods
kubectl top pods -n resilientercho --sort-by=memory

# Check for memory leaks
kubectl logs <pod-name> -n resilientercho | grep -i "memory\|gc"

# Increase resource limits
kubectl patch deployment resilientercho-api -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"1Gi","cpu":"1000m"}}}]}}}}'
```

### 9.4 Connectivity Issues
```bash
# Test service DNS
kubectl run debug --image=busybox -i --tty --rm -- \
  nslookup resilientercho-api.resilientercho.svc.cluster.local

# Test service endpoint
kubectl port-forward svc/resilientercho-api 3001:3001
curl http://localhost:3001/health
```

---

## 🚨 Step 10: Incident Response

### 10.1 Quick Rollback
```bash
# View rollout history
kubectl rollout history deployment/resilientercho-api -n resilientercho

# Rollback to previous version
kubectl rollout undo deployment/resilientercho-api -n resilientercho

# Rollback to specific revision
kubectl rollout undo deployment/resilientercho-api --to-revision=5 -n resilientercho

# Check rollback status
kubectl rollout status deployment/resilientercho-api -n resilientercho -w
```

### 10.2 Emergency Scale Down
```bash
# Scale to 1 replica (to stop processing)
kubectl scale deployment resilientercho-api --replicas=1 -n resilientercho

# Scale to 0 replicas (emergency stop)
kubectl scale deployment resilientercho-api --replicas=0 -n resilientercho

# Resume
kubectl scale deployment resilientercho-api --replicas=3 -n resilientercho
```

### 10.3 Database Recovery
```bash
# Backup database
pg_dump -h <db-host> -U postgres resilientercho > backup-$(date +%s).sql

# Restore from backup
psql -h <db-host> -U postgres resilientercho < backup-1234567890.sql

# Point-in-time recovery (if enabled)
# Contact database provider for PITR restore
```

---

## 📋 Operations Checklist

### Daily
- [ ] Check pod status: `kubectl get pods -n resilientercho`
- [ ] Review error logs: `kubectl logs -l app=resilientercho-api -n resilientercho | grep ERROR`
- [ ] Monitor resource usage: `kubectl top pods -n resilientercho`

### Weekly
- [ ] Run security audit: `npm audit`
- [ ] Review audit logs: `GET /audit/compliance`
- [ ] Check certificate expiration: `kubectl get cert -n resilientercho`

### Monthly
- [ ] Rotate secrets: JWT secret, database password
- [ ] Penetration testing
- [ ] Database backup verification
- [ ] Disaster recovery drill

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Dependency updates
- [ ] Compliance review

---

## 📞 Support Contacts

**On-Call Engineer**: [contact info]
**Database Administrator**: [contact info]
**Security Team**: security@resilientercho.io
**Incident Hotline**: [phone number]

---

**Last Updated**: March 2, 2026
**Version**: 1.0.0
**Status**: ✅ Production-Ready
