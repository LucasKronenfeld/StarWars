# Star Wars API - Docker Deployment Guide

## Quick Start

### First Time Setup

```bash
# 1. Clone/navigate to project root
cd c:\Users\lucas\StarWars\StarWars

# 2. Build and start containers
docker-compose up --build

# 3. Wait for bootstrap (30-60 seconds)
# Watch logs for "Bootstrap seeding result: ok = true"

# 4. Access API
# Health: http://localhost:8080/health
# Swagger: http://localhost:8080/swagger (dev only)
# Films: http://localhost:8080/api/films
```

### Create Admin User

```bash
# 1. Register user (email must match config)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@starwars.local","password":"Admin123!","username":"admin"}'

# 2. Restart API to assign admin role
docker-compose restart api

# 3. Login to get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@starwars.local","password":"Admin123!"}'
```

---

## Troubleshooting

### Network Connectivity Issues

If you see errors like:
```
Error response from daemon: failed to resolve reference "mcr.microsoft.com/dotnet/sdk:8.0": 
  failed to do request: Head "https://mcr.microsoft.com/v2/dotnet/sdk/manifests/8.0": EOF
```

**This means Docker cannot reach Microsoft Container Registry.**

#### Solutions (in order):

1. **Restart Docker Desktop completely**
   - Close Docker Desktop entirely (not just minimize)
   - Wait 30 seconds
   - Reopen Docker Desktop
   - Wait for it to fully initialize before running `docker-compose up --build`

2. **Verify Docker is running and ready**
   ```bash
   docker ps  # Should show no errors
   docker info  # Should show system info
   ```

3. **Check internet connectivity**
   ```bash
   # PowerShell: Test connection to MCR
   Invoke-WebRequest -Uri "https://mcr.microsoft.com" -UseBasicParsing
   
   # Linux/Mac: Test connection to MCR
   curl -I https://mcr.microsoft.com
   ```

4. **Clear Docker cache and retry**
   ```bash
   docker system prune -a  # Remove dangling images
   docker-compose down     # Stop containers
   docker-compose up --build  # Rebuild
   ```

5. **Check Docker Desktop Settings**
   - Go to Settings → Resources → Network
   - Ensure DNS is set to automatic
   - Try toggling "Use WSL 2 based engine" if on Windows

6. **Configure Docker proxy (if behind corporate proxy)**
   - Docker Desktop → Settings → Docker Engine
   - Add proxy settings if your network requires them:
   ```json
   {
     "proxies": {
       "default": {
         "httpProxy": "http://proxy.example.com:3128",
         "httpsProxy": "https://proxy.example.com:3128",
         "noProxy": "localhost,127.0.0.1"
       }
     }
   }
   ```

7. **Use local development as fallback** (no Docker needed)
   ```bash
   # Frontend
   cd Client
   npm install
   npm run dev
   
   # Backend (in another terminal)
   cd Server/StarWarsApi.Server
   dotnet ef database update
   dotnet run
   ```

### Container Issues

**PostgreSQL connection fails:**
```bash
# Check if postgres container is running
docker ps

# View postgres logs
docker logs starwars-postgres

# Verify network connectivity between containers
docker exec starwars-api ping postgres
```

**API won't start:**
```bash
# Check API logs
docker logs starwars-api

# Check if migrations ran
docker logs starwars-api | grep -i migration
```

---

## Configuration

### Environment Variables

The `docker-compose.yml` supports these environment variables:

#### Database
- `ConnectionStrings__DefaultConnection` - Postgres connection string
- `Database__AutoMigrate` - Auto-apply EF migrations (default: true)

#### JWT
- `Jwt__Key` - Secret key for JWT signing (min 32 chars)
- `Jwt__Issuer` - JWT issuer (default: "StarWarsApi")
- `Jwt__Audience` - JWT audience (default: "StarWarsApi")

#### Seeding
- `Seed__AutoBootstrap` - Auto-seed empty database (default: true)
- `Seed__UseExtendedJson` - Load extended JSON files (default: true)
- `Seed__ExtendedJsonPath` - Path to extended data (default: "Data/Extended")
- `Seed__AdminEmails__0` - Admin email (can add more with __1, __2, etc.)
- `Seed__ApiKey` - Optional API key for dev wipe endpoint

#### CORS
- `CORS__Origins__0` - Allowed origin (can add more with __1, __2, etc.)

#### Environment
- `ASPNETCORE_ENVIRONMENT` - Development/Production
- `ASPNETCORE_URLS` - Binding URLs (default: http://+:8080)

### Override in Docker Compose

```bash
# Set custom admin email and JWT key
docker-compose up -d \
  -e Seed__AdminEmails__0=your-admin@company.com \
  -e Jwt__Key=YourVerySecureKeyHere32CharsMin
```

Or create `docker-compose.override.yml`:

```yaml
services:
  api:
    environment:
      Seed__AdminEmails__0: your-admin@company.com
      Jwt__Key: YourVerySecureKeyHere32CharsMin
```

---

## File Structure

```
StarWars/
├── docker-compose.yml           # Production setup
├── docker-compose.dev.yml       # Development setup
├── .dockerignore                # Docker build exclusions
├── Server/
│   └── StarWarsApi.Server/
│       ├── Dockerfile           # Multi-stage .NET build
│       └── Data/
│           └── Extended/        # Extended JSON files
│               ├── films.json
│               ├── planets.json
│               ├── people.json
│               ├── species.json
│               ├── starships.json
│               └── vehicles.json
└── Client/                      # React frontend (separate)
```

---

## Common Commands

### Start/Stop

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# Stop and remove volumes (DELETES DATABASE)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# Postgres only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild

```bash
# Rebuild API image
docker-compose build api

# Rebuild and restart
docker-compose up --build

# Force rebuild (no cache)
docker-compose build --no-cache api
```

### Database Access

```bash
# Connect to Postgres
docker exec -it starwars-postgres psql -U starwars -d starwars

# Backup database
docker exec starwars-postgres pg_dump -U starwars starwars > backup.sql

# Restore database
docker exec -i starwars-postgres psql -U starwars starwars < backup.sql
```

### Container Management

```bash
# List running containers
docker-compose ps

# Stop single service
docker-compose stop api

# Restart single service
docker-compose restart api

# View container resource usage
docker stats
```

---

## Development vs Production

### Development (`docker-compose.dev.yml`)

```bash
docker-compose -f docker-compose.dev.yml up
```

**Features**:
- `ASPNETCORE_ENVIRONMENT=Development`
- Swagger UI enabled
- Dev wipe endpoint available
- Optional hot reload (if configured)
- Seed key for additional security

### Production (`docker-compose.yml`)

```bash
docker-compose up
```

**Features**:
- `ASPNETCORE_ENVIRONMENT=Production`
- Swagger UI disabled
- Dev wipe endpoint blocked
- Optimized build

---

## Extended JSON Data

### Adding Custom Films

1. Edit `Server/StarWarsApi.Server/Data/Extended/films.json`:

```json
{
  "data": [
    {
      "id": "rogue-one",
      "title": "Rogue One: A Star Wars Story",
      "episodeId": 3.5,
      "openingCrawl": "It is a period of civil war...",
      "director": "Gareth Edwards",
      "producer": "Kathleen Kennedy",
      "releaseDate": "2016-12-16",
      "characters": ["https://swapi.dev/api/people/14/"],
      "planets": [],
      "starships": ["https://swapi.dev/api/starships/10/"],
      "vehicles": [],
      "species": []
    }
  ]
}
```

2. Rebuild and restart:

```bash
docker-compose up --build
```

3. Or sync via API (without rebuild):

```bash
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Merge into Existing SWAPI Entity

Use `sameAs` to update an existing entity instead of creating new:

```json
{
  "data": [
    {
      "id": "han-solo-extended",
      "sameAs": "https://swapi.dev/api/people/14/",
      "name": "Han Solo",
      "birthYear": "29BBY"
    }
  ]
}
```

This will **update** Han Solo, not create a duplicate.

---

## Health Checks

### API Health

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T20:00:00Z"
}
```

### Database Health

```bash
docker exec starwars-postgres pg_isready -U starwars
```

Expected output:
```
/var/run/postgresql:5432 - accepting connections
```

### Container Health

```bash
docker-compose ps
```

Look for `healthy` status in STATE column.

---

## Troubleshooting

### Container Exits Immediately

**Check logs**:
```bash
docker-compose logs api
```

**Common causes**:
- Missing JWT key or too short (<32 chars)
- Invalid connection string
- Migration errors

**Solution**: Fix environment variables in docker-compose.yml

### Seeding Failed

**Check logs**:
```bash
docker-compose logs api | grep -i seed
```

**Common causes**:
- SWAPI API down (network issues)
- Invalid extended JSON syntax
- Database constraint violations

**Solution**: Check network, validate JSON files, inspect database

### Database Connection Refused

**Check postgres health**:
```bash
docker-compose ps postgres
docker exec starwars-postgres pg_isready -U starwars
```

**Solution**: Wait for postgres to be ready (check healthcheck)

### Admin Role Not Assigned

**Check configuration**:
```bash
docker exec starwars-api cat appsettings.json | grep -A5 Seed
```

**Check database**:
```bash
docker exec -it starwars-postgres psql -U starwars -d starwars \
  -c "SELECT u.\"Email\", r.\"Name\" FROM \"AspNetUsers\" u 
      JOIN \"AspNetUserRoles\" ur ON u.\"Id\" = ur.\"UserId\" 
      JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\";"
```

**Solution**: 
1. Ensure email in `Seed__AdminEmails__0` matches registered user
2. Restart API to trigger role assignment

### CORS Errors

**Check CORS config**:
```bash
docker exec starwars-api cat appsettings.json | grep -A5 CORS
```

**Solution**: Add frontend origin to `CORS__Origins__0`

### Slow Performance

**Check resource usage**:
```bash
docker stats
```

**Allocate more resources**: Docker Desktop → Settings → Resources

---

## Security Considerations

### For Production Deployment:

1. **Change default passwords**:
   ```yaml
   environment:
     POSTGRES_PASSWORD: use-strong-password-here
   ```

2. **Use secrets for JWT key**:
   ```yaml
   secrets:
     - jwt_key
   ```

3. **Disable auto-migrate** (run migrations manually):
   ```yaml
   environment:
     Database__AutoMigrate: "false"
   ```

4. **Restrict CORS origins**:
   ```yaml
   environment:
     CORS__Origins__0: https://your-production-domain.com
   ```

5. **Use environment-specific compose files**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
   ```

6. **Don't expose Postgres port** (remove ports in compose for API-only access)

7. **Use reverse proxy** (nginx/traefik) for SSL termination

---

## Azure Deployment

### Azure Container Instances

```bash
# Build and push to Azure Container Registry
az acr build --registry your-registry \
  --image starwars-api:latest \
  --file Server/StarWarsApi.Server/Dockerfile .

# Create container instance
az container create \
  --resource-group starwars-rg \
  --name starwars-api \
  --image your-registry.azurecr.io/starwars-api:latest \
  --dns-name-label starwars-api \
  --ports 8080 \
  --environment-variables \
    ConnectionStrings__DefaultConnection='...' \
    Jwt__Key='...' \
    Seed__AdminEmails__0='admin@yourcompany.com'
```

### Azure App Service

1. Use Web App for Containers
2. Set environment variables in Configuration
3. Enable Always On
4. Configure Azure Database for PostgreSQL

### Azure Kubernetes Service (AKS)

Use helm charts with provided docker-compose as reference.

---

## Performance Tuning

### Connection Pooling

Already enabled by default in Npgsql. Adjust if needed:

```
ConnectionStrings__DefaultConnection=Host=postgres;...;Maximum Pool Size=100;
```

### Health Check Intervals

Adjust in `docker-compose.yml`:

```yaml
healthcheck:
  interval: 30s  # Check every 30 seconds
  timeout: 10s   # Wait max 10 seconds
  retries: 3     # Retry 3 times before unhealthy
  start_period: 40s  # Grace period for startup
```

### Resource Limits

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Backup Strategy

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec starwars-postgres pg_dump -U starwars starwars | gzip > backup_$DATE.sql.gz
find . -name "backup_*.sql.gz" -mtime +7 -delete  # Keep last 7 days
```

Run with cron:
```
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
gunzip -c backup_20260203_120000.sql.gz | \
  docker exec -i starwars-postgres psql -U starwars starwars
```

---

## Monitoring

### Prometheus Metrics (Optional)

Add to Program.cs for production metrics.

### Application Insights (Azure)

Add NuGet package and configure in appsettings.json.

### Simple Log Monitoring

```bash
# Watch for errors
docker-compose logs -f api | grep -i error

# Watch seeding activity
docker-compose logs -f api | grep -i seed

# Watch authentication
docker-compose logs -f api | grep -i auth
```

---

## Support

For issues:
1. Check logs: `docker-compose logs -f api`
2. Review [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)
3. Run smoke tests: [SMOKE_TESTS.md](SMOKE_TESTS.md)
4. Check [DIFF_SUMMARY.md](DIFF_SUMMARY.md) for changes overview

---

## License & Credits

Star Wars API - Built with ASP.NET Core 8, EF Core, PostgreSQL  
Data source: SWAPI (Star Wars API)  
May the Force be with you! 🚀⭐
