# Smoke Test Quick Reference

## Quick Start Commands

### 1. Clean Build and Start
```bash
# From project root (c:\Users\lucas\StarWars\StarWars)
docker-compose down -v
docker-compose up --build
```

### 2. Check Initial Bootstrap
```bash
# View API logs for seeding confirmation
docker-compose logs -f api

# Look for these messages:
# ✓ "Applying pending database migrations..."
# ✓ "Bootstrap seeding result: {@Result}"
# ✓ "ok = true"
```

### 3. Health Check
```bash
curl http://localhost:8080/health
# Expected: {"status":"healthy","timestamp":"2026-02-03T..."}
```

### 4. Verify Data Loaded
```bash
# Check films (should include SWAPI + extended)
curl http://localhost:8080/api/films

# Check starships
curl http://localhost:8080/api/starships?page=1&pageSize=10
```

## Admin User Setup

### 1. Register Admin User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@starwars.local",
    "password": "Admin123!",
    "username": "admin"
  }'
```

### 2. Restart to Assign Admin Role
```bash
docker-compose restart api

# Check logs for role assignment
docker-compose logs -f api | grep "Assigned 'Admin' role"
```

### 3. Login and Get JWT
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@starwars.local",
    "password": "Admin123!"
  }'

# Save the token from response
export JWT_TOKEN="eyJhbGc..."
```

## Admin Endpoint Tests

### Check Environment
```bash
curl http://localhost:8080/api/admin/environment \
  -H "Authorization: Bearer $JWT_TOKEN"
  
# Expected: {"environment":"Production","isDevelopment":false}
```

### Sync Catalog (Safe)
```bash
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer $JWT_TOKEN"
  
# Expected: Success with counts
# {"ok":true,"catalogOnly":true,"counts":{...}}
```

### Dev Wipe (Should Fail in Production)
```bash
curl -X POST http://localhost:8080/api/admin/dev-wipe-reseed \
  -H "Authorization: Bearer $JWT_TOKEN"
  
# Expected: 403 Forbidden
# "Dev wipe only allowed in Development environment"
```

## Idempotency Test

Run sync 3 times and compare counts:

```bash
# First sync
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Second sync (should show 0 inserted, all updated)
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Third sync (should be identical to second)
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
```

## Database Verification

### Connect to Postgres
```bash
docker exec -it starwars-postgres psql -U starwars -d starwars
```

### Check Data Source Identity
```sql
-- Check films have Source and SourceKey
SELECT "Id", "Source", "SourceKey", "Title" 
FROM "Films" 
ORDER BY "Source", "EpisodeId";

-- Should see:
-- Source='swapi', SourceKey=SWAPI URL for original trilogy
-- Source='extended', SourceKey='rogue-one' for extended films

-- Check for duplicates (should return 0)
SELECT "Source", "SourceKey", COUNT(*) 
FROM "Films" 
GROUP BY "Source", "SourceKey" 
HAVING COUNT(*) > 1;

-- Check starships
SELECT "Id", "Source", "SourceKey", "Name", "IsActive", "IsCatalog"
FROM "Starships"
WHERE "IsCatalog" = true
ORDER BY "Source", "Name";
```

## Extended JSON Tests

### 1. View Current Extended Films
```bash
# On Windows
type Server\StarWarsApi.Server\Data\Extended\films.json

# On Linux/Mac
cat Server/StarWarsApi.Server/Data/Extended/films.json
```

### 2. Modify Extended Data
```json
// Edit films.json - change Rogue One title
{
  "data": [
    {
      "id": "rogue-one",
      "title": "Rogue One: A Star Wars Story (Updated)",
      ...
    }
  ]
}
```

### 3. Sync and Verify Update
```bash
# Sync catalog
curl -X POST http://localhost:8080/api/admin/sync-catalog \
  -H "Authorization: Bearer $JWT_TOKEN"

# Check if title was updated
curl http://localhost:8080/api/films | jq '.[] | select(.title | contains("Rogue One"))'
```

## Frontend Tests (if running Vite dev server)

### 1. Start Frontend
```bash
cd Client
npm install
npm run dev
```

### 2. Navigate to Admin Page
```
http://localhost:5173/admin/catalog
```

### 3. Verify UI
- ✓ "Sync Catalog" button visible
- ✓ No "Dev Tools" section (production mode)
- ✓ Can retire/activate starships
- ✓ Pagination works
- ✓ Search works

## Performance Benchmarks

### Expected Times (approximate)
- **First startup (empty DB)**: 30-60 seconds
  - Migrations: 5-10 seconds
  - SWAPI data: 20-30 seconds
  - Extended JSON: <5 seconds
  
- **Subsequent startup (existing data)**: 10-20 seconds
  - Skip seeding (data exists)
  
- **Sync catalog**: 15-25 seconds
  - Upsert all entities
  - Rebuild relationships

## Troubleshooting Quick Checks

### API Won't Start
```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs api

# Common issues:
# - JWT key missing/too short
# - Database connection refused (postgres not ready)
# - Migration errors
```

### Seeding Failed
```bash
# Check seeder logs
docker-compose logs api | grep -i "seed"

# Common issues:
# - SWAPI API down (network error)
# - JSON parsing error (invalid extended JSON)
# - Database constraint violation (check unique indexes)
```

### Admin Role Not Assigned
```bash
# Check admin email configuration
docker-compose exec api cat appsettings.json | grep -A5 "Seed"

# Check if user exists in database
docker exec -it starwars-postgres psql -U starwars -d starwars \
  -c "SELECT \"Email\", \"NormalizedEmail\" FROM \"AspNetUsers\";"

# Check if user has admin role
docker exec -it starwars-postgres psql -U starwars -d starwars \
  -c "SELECT u.\"Email\", r.\"Name\" 
      FROM \"AspNetUsers\" u 
      JOIN \"AspNetUserRoles\" ur ON u.\"Id\" = ur.\"UserId\" 
      JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\";"
```

### CORS Errors in Frontend
```bash
# Check CORS configuration
docker-compose exec api cat appsettings.json | grep -A5 "CORS"

# Check API logs for CORS rejections
docker-compose logs api | grep -i "cors"
```

## Success Criteria Summary

✅ **Pass**: All these should succeed:
1. Docker starts without errors
2. Health endpoint returns healthy
3. Films endpoint returns data (including extended films)
4. Admin user can be created and assigned role
5. Sync catalog endpoint works (returns counts)
6. Running sync multiple times doesn't create duplicates
7. Extended JSON modifications are reflected after sync
8. User fleets are preserved after sync

❌ **Fail**: Any of these indicate issues:
1. Container exits immediately after start
2. Health endpoint times out or returns error
3. Films endpoint returns empty array or 500 error
4. Admin role never gets assigned (after restart)
5. Sync catalog returns errors or creates duplicates
6. Extended JSON changes not visible after sync
7. User fleets disappear after sync

## Contact / Issues

If smoke tests fail, check:
1. `REFACTORING_SUMMARY.md` - Full documentation
2. Docker logs: `docker-compose logs -f`
3. Database state: Connect with psql and inspect tables
4. Configuration: Verify `appsettings.json` and environment variables
