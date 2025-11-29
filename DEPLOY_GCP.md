# Deploy Checklist cho Google Cloud

## 1. Pre-deployment (Local)

### Rebuild server image sau khi sửa data-source.ts
```bash
docker compose build server
# hoặc rebuild all
docker compose build
```

### Test locally
```bash
docker compose up -d
docker compose ps
docker compose logs -f nginx
curl http://localhost/api
```

---

## 2. VPS Setup (34.142.150.3)

### Install Docker & Docker Compose
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt-get install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### GCP Firewall Rules
```bash
# Allow HTTP/HTTPS
gcloud compute firewall-rules create allow-http --allow tcp:80 --source-ranges 0.0.0.0/0
gcloud compute firewall-rules create allow-https --allow tcp:443 --source-ranges 0.0.0.0/0

# Internal ports (optional, nếu cần debug)
# gcloud compute firewall-rules create allow-internal --allow tcp:8000,8001,8080,3306,9000
```

### Clone repository
```bash
cd /opt
sudo git clone --branch dev-minh https://github.com/VinhNTHE171667/SP-GenSpa.git sp-genspa
cd sp-genspa
sudo chown -R $USER:$USER .
```

---

## 3. Production Configuration

### Update .env với production secrets
```bash
# Edit .env
nano .env

# Thay đổi:
# - JWT_SECRET (generate strong random: openssl rand -hex 32)
# - DB_PASSWORD (strong password)
# - EMAIL_PASS (app-specific password)
# - API keys nếu cần
```

### (Optional) Setup SSL với Certbot
```bash
# Install certbot
sudo apt-get install certbot -y

# Get certificate (chạy khi nginx đã up và port 80 accessible)
sudo certbot certonly --standalone -d g52-genspa.xyz -d www.g52-genspa.xyz

# Certificates sẽ ở: /etc/letsencrypt/live/g52-genspa.xyz/

# Mount vào nginx: uncomment SSL volume trong docker-compose.yml:
# - /etc/letsencrypt:/etc/letsencrypt:ro

# Uncomment HTTPS server block trong nginx.conf
```

---

## 4. Deploy

### Option A: Build on VPS (recommended cho lần đầu)
```bash
cd /opt/sp-genspa

# Pull latest code
git fetch && git pull origin dev-minh

# Build and start
docker compose up -d --build --remove-orphans

# Watch logs
docker compose logs -f init
docker compose logs -f server
docker compose logs -f nginx
```

### Option B: Push images từ local
```bash
# Local: tag & push
docker tag sp-genspa-server:latest yourusername/sp-genspa-server:latest
docker tag sp-genspa-ai:latest yourusername/sp-genspa-ai:latest
docker tag sp-genspa-recommender:latest yourusername/sp-genspa-recommender:latest

docker push yourusername/sp-genspa-server:latest
docker push yourusername/sp-genspa-ai:latest
docker push yourusername/sp-genspa-recommender:latest

# VPS: update docker-compose.yml to use images, then pull
docker compose pull
docker compose up -d
```

---

## 5. Post-Deploy

### Run migrations
```bash
# Wait for init to finish
docker compose logs init | grep "Init tasks finished"

# Run migrations
docker compose run --rm server sh -c "node ./node_modules/typeorm/cli.js -d dist/db/data-source.js migration:run"
```

### Seed database (optional)
```bash
docker compose run --rm server npm run seed:data
```

### Verify services
```bash
# Check running containers
docker compose ps

# Check healthchecks
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test endpoints
curl http://34.142.150.3/api
curl http://34.142.150.3/ai
curl http://34.142.150.3/recommendation

# Or with domain (after DNS setup)
curl https://g52-genspa.xyz/api
```

---

## 6. DNS Configuration

Point domain `g52-genspa.xyz` to VPS IP `34.142.150.3`:

```
Type: A
Name: @
Value: 34.142.150.3
TTL: 3600

Type: A
Name: www
Value: 34.142.150.3
TTL: 3600
```

---

## 7. Monitoring & Maintenance

### View logs
```bash
docker compose logs -f [service_name]
docker compose logs --tail=100 server
```

### Restart services
```bash
docker compose restart [service_name]
```

### Update deployment
```bash
git pull origin dev-minh
docker compose up -d --build
```

### Backup database
```bash
# Backup MySQL
docker compose exec mysql mysqldump -u root -proot gen_spa > backup_$(date +%Y%m%d).sql

# Backup volumes
sudo tar -czf backup_volumes_$(date +%Y%m%d).tar.gz server/mysql-data minio/data milvus/db
```

---

## Common Issues

### Port already in use
```bash
# Find process using port
sudo lsof -i :80
sudo kill -9 <PID>
```

### Containers crash/restart loop
```bash
# Check logs
docker compose logs [service]

# Check resources
docker stats
free -h
df -h
```

### Database connection refused
- Verify `DB_HOST=mysql` in .env
- Check mysql container is running: `docker compose ps mysql`
- Check logs: `docker compose logs mysql`

### Nginx 502 Bad Gateway
- Verify backend services are running: `docker compose ps`
- Check backend health: `docker compose exec server wget -O- http://localhost:8080/api`
- Check nginx logs: `docker compose logs nginx`
