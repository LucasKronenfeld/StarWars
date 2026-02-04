# Star Wars API - Docker/Azure Refactoring Summary

## Overview
This refactoring makes the Star Wars API Docker/Azure ready with production-safe seeding, unified data source identity, and extended JSON support.

---

## Changes Summary

### A) Unified Data Source Identity System

**Purpose**: Prevent duplicates from SWAPI and extended JSON sources.

**Files Modified**:
- `Models/Films.cs`
- `Models/Person.cs`
- `Models/Plantet.cs` (Planet)
- `Models/Species.cs`
- `Models/Starship.cs`
- `Models/Vehicle.cs`
- `Data/ApplicationDbContext.cs`

**Changes**:
- Added `Source` field (string): "swapi" or "extended"
- Added `SourceKey` field (string): stable unique identifier within Source
- For SWAPI: SourceKey = SWAPI URL
- For Extended: SourceKey = JSON id
- For Starships: kept legacy `SwapiUrl` for backward compatibility
- Added composite unique indexes: `(Source, SourceKey)` for all catalog entities

**Migration**: `AddDataSourceIdentity`
- Run: `dotnet ef database update`

---

### B) Production-Safe Seeding Pipeline

**File**: `Data/Seeding/DatabaseSeeder.cs` (completely refactored)

**Key Features**:
1. **Upsert Logic**: All seeding operations use `(Source, SourceKey)` to find and update existing rows
2. **No Duplicates**: Extended JSON can merge into SWAPI entities via `sameAs` or create new entities
3. **Preserves User Data**: Never wipes fleets or user-owned starships in production mode
4. **Idempotent**: Safe to run multiple times

**Public Methods**:
- `BootstrapAsync()` - Automatic first-run seeding if database is empty
- `SyncCatalogAsync()` - Production-safe upsert (SWAPI + extended JSON)
- `SeedAsync(force)` - Development-only full wipe and reseed
- `NeedsBootstrapAsync()` - Check if database needs initial seeding

**Pipeline Stages**:
1. `SeedOrSyncSwapiAsync()` - Upsert all SWAPI entities
2. `SeedOrSyncExtendedJsonAsync()` - Upsert extended JSON entities (if enabled)
3. `FinalizeRetireRulesAsync()` - Retire SWAPI catalog starships no longer in API

---

### C) Extended JSON Support

**Schema**: `Data/Seeding/ExtendedJsonSchema.cs`

**DTOs**:
- `ExtendedFilmDto`
- `ExtendedPersonDto`
- `ExtendedPlanetDto`
- `ExtendedSpeciesDto`
- `ExtendedStarshipDto`
- `ExtendedVehicleDto`

**Key Properties**:
- `id` (string): becomes SourceKey for extended entities
- `sameAs` (string, optional): SWAPI URL to merge into existing entity
- All normal entity fields
- Relationship arrays using IDs (SWAPI urls or extended ids)

**Sample Files** (in `Data/Extended/`):
- `films.json` - Includes Rogue One and Solo examples
- `planets.json` - Includes Ahch-To example
- `people.json`, `species.json`, `starships.json`, `vehicles.json` - Empty templates

**Configuration**:
```json
"Seed": {
  "UseExtendedJson": true,
  "ExtendedJsonPath": "Data/Extended"
}
```

---

### D) Startup Bootstrap Seeding

**File**: `Program.cs`

**Changes**:
1. **Auto Migrations**:
   - Automatically applies EF Core migrations on startup
   - Configurable: `Database:AutoMigrate` (default: true)

2. **Bootstrap Seeding**:
   - Checks if database is empty on startup
   - If empty, runs automatic seeding (SWAPI + extended JSON)
   - Configurable: `Seed:AutoBootstrap` (default: true)
   - Non-blocking: app continues even if seeding fails

3. **Docker-Friendly**:
   - Logs all seeding activity
   - Uses cancellation tokens for graceful shutdown
   - Health checks wait for seeding to complete

---

### E) Updated Admin Endpoints

**File**: `Controllers/AdminController.cs`

**Endpoints**:

1. **`POST /api/admin/sync-catalog`** (Production-Safe)
   - Requires: Admin JWT role
   - Action: Upserts SWAPI + extended JSON without wiping user data
   - Safe for production use
   - Returns: counts of inserted/updated/retired entities

2. **`POST /api/admin/dev-wipe-reseed`** (Development-Only)
   - Requires: Admin JWT role + Development environment
   - Optional: `X-SEED-KEY` header (if configured)
   - Action: Full database wipe and reseed
   - Returns: counts of all seeded entities

3. **`GET /api/admin/environment`**
   - Requires: Admin JWT role
   - Returns: `{ environment: string, isDevelopment: bool }`
   - Used by frontend to show/hide dev-only features

**Removed**:
- Old `/api/admin/seed` endpoint (replaced by new endpoints)

---

### F) Frontend Admin Page Updates

**File**: `Client/src/api/adminApi.ts`

**New Functions**:
- `syncCatalog()` - Production-safe catalog sync
- `devWipeReseed(seedKey?)` - Dev-only wipe and reseed
- `getEnvironment()` - Check if backend is in dev mode

**File**: `Client/src/pages/AdminCatalog.tsx`

**New Features**:
1. **Environment Detection**: Checks backend environment on load
2. **Production Mode**: Shows only "Sync Catalog" button
3. **Development Mode**: Shows additional "Dev Tools" section with:
   - Seed key input (optional)
   - "Wipe & Reseed Database" button with confirmation
4. **Better UX**: Clearer messaging for success/error states

---

### G) Docker Setup

**Files Created**:
- `docker-compose.yml` (production)
- `docker-compose.dev.yml` (development)
- `Server/StarWarsApi.Server/Dockerfile`
- `.dockerignore`

**Features**:
1. **Multi-container setup**:
   - PostgreSQL 16 (with health checks)
   - ASP.NET Core API

2. **Environment Variables**:
   - Connection strings
   - JWT configuration
   - Seeding settings
   - Admin emails
   - CORS origins

3. **Volumes**:
   - Persistent Postgres data
   - Extended JSON files included in image

4. **Health Checks**:
   - Postgres: `pg_isready`
   - API: `/health` endpoint

5. **Networking**:
   - Bridge network for service communication
   - Exposed ports: 5432 (Postgres), 8080 (API)

---

### H) Configuration Updates

**File**: `appsettings.json`

**New Sections**:
```json
{
  "Database": {
    "AutoMigrate": true
  },
  "Seed": {
    "AutoBootstrap": true,
    "UseExtendedJson": true,
    "ExtendedJsonPath": "Data/Extended",
    "AdminEmails": [],
    "ApiKey": ""
  },
  "CORS": {
    "Origins": [
      "http://localhost:5173",
      "http://localhost:5174"
    ]
  }
}
```

**File**: `Program.cs`

**CORS Enhancement**:
- Now supports configuration-based origins
- Falls back to default localhost origins if not configured
- Environment variable support for Docker

**Health Endpoint**:
- `GET /health` - Returns `{ status: "healthy", timestamp: UTC }`
- Used by Docker healthchecks and Azure App Service

---

## Breaking Changes

### 1. Database Schema
- **Required**: Run `dotnet ef database update` to apply new migration
- New fields: `Source` and `SourceKey` on all catalog entities
- New composite unique indexes
- Existing data will need Source/SourceKey populated (migration handles this)

### 2. Admin API Endpoints
- **Removed**: `POST /api/admin/seed` with query params
- **Replaced with**:
  - `POST /api/admin/sync-catalog` (production-safe)
  - `POST /api/admin/dev-wipe-reseed` (dev-only)
- **New**: `GET /api/admin/environment`

### 3. Frontend Admin Page
- Old seed button removed
- New buttons: "Sync Catalog" and "Dev Tools"
- Requires backend update to work properly

### 4. Configuration
- New required config sections (see above)
- Old `Seed:AllowCatalogSyncInProduction` removed (no longer needed)

---

## Migration Guide

### For Existing Development Setup:

1. **Pull changes and rebuild**:
   ```bash
   cd Server/StarWarsApi.Server
   dotnet restore
   dotnet build
   ```

2. **Apply database migration**:
   ```bash
   dotnet ef database update
   ```

3. **Update appsettings.Development.json** (add new config sections):
   ```json
   {
     "Database": { "AutoMigrate": true },
     "Seed": {
       "AutoBootstrap": true,
       "UseExtendedJson": true,
       "ExtendedJsonPath": "Data/Extended",
       "AdminEmails": ["your-email@example.com"],
       "ApiKey": "dev-seed-key-12345"
     }
   }
   ```

4. **Restart API**:
   ```bash
   dotnet run
   ```
   - First run will auto-seed if database is empty
   - Check logs to confirm seeding success

5. **Update frontend** (if using separate client):
   ```bash
   cd Client
   npm install
   npm run dev
   ```

### For Docker Deployment:

1. **Build and run**:
   ```bash
   docker-compose up --build
   ```

2. **Check logs**:
   ```bash
   docker-compose logs -f api
   ```
   - Look for "Bootstrap seeding result" message
   - Database should auto-migrate and seed on first run

3. **Access API**:
   - API: http://localhost:8080
   - Health: http://localhost:8080/health
   - Swagger (dev only): http://localhost:8080/swagger

4. **Create admin user**:
   - Register via `/api/auth/register` endpoint
   - Use the email configured in `Seed:AdminEmails`
   - User will automatically get Admin role on next startup

### For Production (Azure):

1. **Set environment variables** in Azure App Service:
   ```
   ConnectionStrings__DefaultConnection=<azure-postgres-connection-string>
   Jwt__Key=<secure-random-key-at-least-32-chars>
   Seed__AdminEmails__0=admin@yourcompany.com
   Seed__UseExtendedJson=true
   Database__AutoMigrate=true (or false, run migrations separately)
   ASPNETCORE_ENVIRONMENT=Production
   ```

2. **Deploy** using Azure DevOps, GitHub Actions, or direct deployment

3. **First run**:
   - App will auto-migrate database
   - App will auto-seed if database is empty
   - Register admin user with configured email
   - Restart app to assign admin role

4. **Update catalog**:
   - Use `/api/admin/sync-catalog` endpoint
   - No wipe risk - safe for production

---

## File-by-File Changes

### Backend (C#)

| File | Change Type | Description |
|------|-------------|-------------|
| `Models/Films.cs` | Modified | Added Source/SourceKey fields |
| `Models/Person.cs` | Modified | Added Source/SourceKey fields |
| `Models/Plantet.cs` | Modified | Added Source/SourceKey fields |
| `Models/Species.cs` | Modified | Added Source/SourceKey fields |
| `Models/Starship.cs` | Modified | Added Source/SourceKey fields, updated comments |
| `Models/Vehicle.cs` | Modified | Added Source/SourceKey fields |
| `Data/ApplicationDbContext.cs` | Modified | Added composite unique indexes |
| `Data/Seeding/DatabaseSeeder.cs` | **Refactored** | Complete rewrite with upsert pipeline |
| `Data/Seeding/ExtendedJsonSchema.cs` | **New** | Extended JSON DTOs |
| `Controllers/AdminController.cs` | **Refactored** | New endpoints, removed old seed endpoint |
| `Program.cs` | Modified | Added auto-migrate, bootstrap seeding, health endpoint |
| `appsettings.json` | Modified | Added new config sections |
| `Migrations/AddDataSourceIdentity.cs` | **New** | EF Core migration for new fields |

### Frontend (TypeScript/React)

| File | Change Type | Description |
|------|-------------|-------------|
| `api/adminApi.ts` | Modified | New functions for sync/wipe/environment |
| `pages/AdminCatalog.tsx` | Modified | New UI for prod sync + dev tools |

### Docker

| File | Change Type | Description |
|------|-------------|-------------|
| `docker-compose.yml` | **New** | Production docker setup |
| `docker-compose.dev.yml` | **New** | Development docker setup |
| `Server/StarWarsApi.Server/Dockerfile` | **New** | Multi-stage .NET 8 build |
| `.dockerignore` | **New** | Ignore build artifacts |

### Extended Data

| File | Change Type | Description |
|------|-------------|-------------|
| `Data/Extended/films.json` | **New** | Sample extended films (Rogue One, Solo) |
| `Data/Extended/planets.json` | **New** | Sample extended planet (Ahch-To) |
| `Data/Extended/people.json` | **New** | Empty template |
| `Data/Extended/species.json` | **New** | Empty template |
| `Data/Extended/starships.json` | **New** | Empty template |
| `Data/Extended/vehicles.json` | **New** | Empty template |

---

## Extended JSON Schema Examples

### Example 1: New Film (Rogue One)

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
      "characters": [],
      "planets": [],
      "starships": [],
      "vehicles": [],
      "species": []
    }
  ]
}
```

### Example 2: Merge into Existing SWAPI Entity

```json
{
  "data": [
    {
      "id": "han-solo-extended",
      "sameAs": "https://swapi.dev/api/people/14/",
      "name": "Han Solo",
      "birthYear": "29BBY",
      "films": ["solo"]
    }
  ]
}
```
- This will **update** the existing Han Solo entity (from SWAPI)
- Won't create a duplicate

### Example 3: New Extended Starship

```json
{
  "data": [
    {
      "id": "raddus",
      "name": "Raddus",
      "model": "MC75 Star Cruiser",
      "manufacturer": "Mon Calamari Shipyards",
      "starshipClass": "Star Cruiser",
      "films": ["rogue-one"],
      "pilots": []
    }
  ]
}
```

---

## Docker Run Instructions

### Development Mode

```bash
# Build and start services
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Stop services
docker-compose -f docker-compose.dev.yml down

# Wipe everything (including volumes)
docker-compose -f docker-compose.dev.yml down -v
```

### Production Mode

```bash
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f api

# Check health
curl http://localhost:8080/health

# Stop services
docker-compose down

# Backup database
docker exec starwars-postgres pg_dump -U starwars starwars > backup.sql
```

### Environment Variable Override

```bash
# Override admin email for docker run
docker-compose up -d \
  -e Seed__AdminEmails__0=your-admin@company.com \
  -e Jwt__Key=YourProductionSecretKeyHere
```

---

## Smoke Test Checklist

### ✅ Pre-Deployment Tests

1. **Build passes**:
   ```bash
   cd Server/StarWarsApi.Server
   dotnet build
   # Should succeed with 0 errors
   ```

2. **Migration applies**:
   ```bash
   dotnet ef database update
   # Check for AddDataSourceIdentity migration
   ```

3. **Docker builds**:
   ```bash
   docker-compose build
   # Should complete without errors
   ```

### ✅ First-Run Tests

1. **Docker startup (fresh database)**:
   ```bash
   docker-compose up -d
   docker-compose logs -f api
   # Look for: "Bootstrap seeding result"
   # Look for: "ok = true"
   ```

2. **Health check**:
   ```bash
   curl http://localhost:8080/health
   # Expected: {"status":"healthy","timestamp":"..."}
   ```

3. **Catalog data loaded**:
   ```bash
   curl http://localhost:8080/api/films
   # Should return array of films including extended JSON films
   ```

4. **Register user**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@starwars.local","password":"Test123!","username":"admin"}'
   # Expected: success response with JWT
   ```

5. **Restart to assign admin role**:
   ```bash
   docker-compose restart api
   docker-compose logs -f api
   # Look for: "Assigned 'Admin' role to user 'admin@starwars.local'"
   ```

### ✅ Admin Endpoint Tests

1. **Get JWT token**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@starwars.local","password":"Test123!"}'
   # Copy the token from response
   ```

2. **Environment check**:
   ```bash
   curl http://localhost:8080/api/admin/environment \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   # Expected: {"environment":"Production","isDevelopment":false}
   ```

3. **Sync catalog (production-safe)**:
   ```bash
   curl -X POST http://localhost:8080/api/admin/sync-catalog \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   # Expected: {"ok":true,"catalogOnly":true,"counts":{...}}
   ```

4. **Dev wipe (dev only, should fail in production)**:
   ```bash
   curl -X POST http://localhost:8080/api/admin/dev-wipe-reseed \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   # Expected in production: 403 Forbidden
   # Expected in dev: wipe and reseed success
   ```

### ✅ Idempotency Tests

1. **Run sync multiple times**:
   ```bash
   curl -X POST http://localhost:8080/api/admin/sync-catalog \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   # Run 3 times
   # Expected: counts should stabilize (no duplicates)
   # First run: many inserted
   # Second run: all updated (0 inserted)
   # Third run: all updated (0 inserted)
   ```

2. **Extended JSON update**:
   - Edit `Data/Extended/films.json` (change a title)
   - Run sync again
   - Check that film was updated (not duplicated)

### ✅ Data Integrity Tests

1. **User data preserved**:
   - Create a fleet with some starships
   - Run catalog sync
   - Check that fleet still exists with same ships

2. **Retired ships stay in fleets**:
   - Add a catalog ship to fleet
   - Retire that ship via admin panel
   - Check that ship is still visible in fleet (but retired)
   - Try adding retired ship to another fleet (should fail)

3. **Extended JSON doesn't duplicate SWAPI**:
   - Create extended JSON with `sameAs` pointing to SWAPI URL
   - Run sync
   - Check database for duplicates:
     ```sql
     SELECT * FROM "Films" WHERE "Source" = 'swapi' AND "SourceKey" LIKE '%films/1%';
     -- Should return exactly 1 row
     ```

---

## Endpoints Changed/Added

### Added:
- `POST /api/admin/sync-catalog` - Production-safe catalog sync
- `POST /api/admin/dev-wipe-reseed` - Dev-only wipe and reseed
- `GET /api/admin/environment` - Check environment info
- `GET /health` - Health check for Docker/Azure

### Removed:
- `POST /api/admin/seed?catalogOnly=&force=` - Split into separate endpoints

### Unchanged:
- All catalog endpoints (`/api/films`, `/api/starships`, etc.)
- Auth endpoints (`/api/auth/register`, `/api/auth/login`)
- Fleet endpoints (`/api/fleet`, etc.)
- Admin catalog management (`/api/admin/catalog/starships`, retire/activate)

---

## Known Issues & Limitations

1. **Extended JSON Relationships**:
   - Circular references are not automatically validated
   - Invalid reference IDs are silently ignored (logged as warnings)
   - Consider adding validation before loading

2. **Migration Performance**:
   - Large databases may take time for AddDataSourceIdentity migration
   - Consider creating indexes after migration for better performance

3. **Docker Volume Persistence**:
   - `docker-compose down -v` will DELETE all data (including database)
   - Use named volumes in production for data persistence

4. **Health Check Timing**:
   - Initial startup may take 30-60 seconds (migrations + seeding)
   - Health check starts after 40 seconds (configurable in docker-compose)

5. **Extended JSON Path**:
   - Must be relative to app root in Docker
   - Files are copied during Docker build
   - Runtime changes require rebuild

---

## Future Enhancements (Not Implemented)

1. **Versioning**:
   - Considered but removed per requirements
   - Could add `CatalogVersion` field in future if needed

2. **Incremental Sync**:
   - Currently syncs all entities every time
   - Could optimize to only sync changed entities using timestamps

3. **Extended JSON Validation**:
   - No JSON schema validation currently
   - Could add JSON schema validator for extended files

4. **Admin UI for Extended JSON**:
   - Currently file-based only
   - Could add admin UI to manage extended data

5. **Rollback Support**:
   - No built-in rollback for failed syncs
   - Could add transaction scoping for atomic syncs

---

## Support & Troubleshooting

### Common Issues:

**Issue**: Migration fails with "column already exists"
**Solution**: Drop and recreate database, or remove migration and re-add

**Issue**: Seeding fails with "database locked"
**Solution**: Ensure no other processes are using the database

**Issue**: Docker container exits immediately
**Solution**: Check logs (`docker-compose logs api`), usually JWT key or connection string issue

**Issue**: Extended JSON not loading
**Solution**: Check `Seed:UseExtendedJson` is true and path is correct

**Issue**: Admin role not assigned
**Solution**: Ensure email in `Seed:AdminEmails` matches registered user (case-insensitive)

**Issue**: CORS errors in frontend
**Solution**: Add frontend origin to `CORS:Origins` config

---

## Acceptance Criteria Status

✅ Running `docker compose up --build` should:
- ✅ Start Postgres
- ✅ Apply migrations
- ✅ Seed initial catalog automatically if DB empty (SWAPI + JSON)
- ✅ API comes up ready with data

✅ Re-running docker compose should:
- ✅ Not duplicate data
- ✅ Not wipe user data
- ✅ Only upsert updates if any changes exist

✅ Extended JSON does NOT duplicate SWAPI entities:
- ✅ If `sameAs` points to SWAPI url, it merges into the SWAPI row
- ✅ Otherwise it creates a separate catalog row with Source="extended"

✅ Admin panel:
- ✅ Works using Admin JWT role only
- ✅ Can trigger safe sync in production mode
- ✅ Dev wipe is gated to Development only

---

## Conclusion

This refactoring achieves all requirements:
- ✅ Docker/Azure ready with automatic bootstrapping
- ✅ Production-safe upsert seeding (no data loss)
- ✅ Extended JSON support with no duplicates
- ✅ Idempotent seeding pipeline
- ✅ Admin role-based endpoints
- ✅ Health checks for container orchestration
- ✅ Comprehensive documentation

The system is ready for production deployment!
