# Admin Removal & One-Time Seeding

## What Changed

This project has been simplified to use **one-time seeding only** with **no admin functionality**.

### Architecture Philosophy

- **Canon catalog is immutable** after initial seed
- No live catalog sync in production
- Starships in fleets are never hard-deleted
- Users can fork catalog ships → custom ships
- Canon updates happen only via code + seed files + redeploy

### Removed Components

#### Backend (C# / ASP.NET Core)
- ❌ `AdminController.cs` - removed all admin endpoints
- ❌ `AdminCatalogController.cs` - removed catalog management endpoints
- ❌ `BootstrapAdminRoleAsync()` - removed admin role creation
- ❌ `SyncCatalogAsync()` - removed live sync functionality
- ❌ `Seed:AdminEmails` config - no longer needed
- ❌ `Seed:ApiKey` config - no authentication for seeding needed

#### Frontend (React / TypeScript)
- ❌ `adminApi.ts` - removed admin API client
- ❌ `AdminCatalog.tsx` - removed admin dashboard page
- ❌ `RequireAdmin` component - removed admin auth guard
- ❌ `isAdmin` from AuthContext - removed admin role checking
- ❌ Admin nav link - removed from Navbar

### What Remains

#### User Features (Still Fully Functional)
- ✅ User registration & authentication
- ✅ Catalog browsing (films, people, planets, species, starships, vehicles)
- ✅ Fleet management (add starships to your fleet)
- ✅ Custom starships (create from scratch)
- ✅ Fork catalog ships (copy-on-edit)
- ✅ Ship builder & editor

#### Seeding Behavior
- ✅ **One-time bootstrap** - seeds SWAPI data when database is empty
- ✅ **Extended JSON support** - optionally loads additional canon data
- ✅ **Duplicate preflight check** - in Development mode, fails if extended JSON duplicates SWAPI data
- ✅ **Production-safe** - in Production mode, seeding only runs once at first startup

## How It Works Now

### First Startup
1. Container starts
2. Database migrations apply
3. Seeding check runs:
   - If catalog exists → skip seeding
   - If catalog empty → run one-time seed:
     - Load SWAPI data (films, people, planets, species, starships, vehicles)
     - If `Seed:UseExtendedJson=true`, load additional JSON files
     - In Development: preflight check fails if duplicates detected
4. API becomes available

### Subsequent Startups
- Migrations apply (if any new ones)
- Seeding skipped (catalog already exists)
- API becomes available immediately

### Development Workflow

#### To Reset & Reseed in Dev
```bash
# Drop and recreate database
docker-compose down -v
docker-compose up postgres -d

# Run migrations + seeding
cd Server/StarWarsApi.Server
dotnet ef database update
dotnet run
```

#### To Update Canon Data
1. Edit SWAPI mapping code or extended JSON files
2. Wipe dev database: `docker-compose down -v`
3. Test seeding: `dotnet run`
4. Validate no duplicates (preflight check will fail if issues)
5. Deploy new container

### Configuration

#### appsettings.json (Production)
```json
"Seed": {
  "AutoBootstrap": true,
  "UseExtendedJson": true,
  "ExtendedJsonPath": "Data/Extended"
}
```

#### appsettings.Development.json
```json
"Seed": {
  "ApiKey": "dev-seed-key-123",
  "ExtendedJsonPath": "Data/Seeding/Extended data seeding"
}
```

Note: `ApiKey` in Development is legacy and not used anymore.

## Benefits of This Approach

### Simplicity
- No privileged admin accounts
- No special endpoints to secure
- No role management complexity

### Safety
- Canon data can't be accidentally modified in production
- No sync operations that could fail mid-flight
- Preflight checks catch issues before deployment

### Clarity
- One source of truth: seed files + SWAPI
- Clear separation: canon (read-only) vs user data (mutable)
- Predictable: seeding happens once, never again

## Future Updates to Canon

If you want to add new films, characters, or ships:

### Option 1: Extended JSON (Recommended for Small Additions)
1. Add to `Data/Extended/*.json` files
2. Test locally (preflight will catch duplicates)
3. Deploy new container
4. For existing deployments: requires manual migration or new environment

### Option 2: Code Changes (For Structural Changes)
1. Modify `DatabaseSeeder.cs` SWAPI mapping
2. Create new migration if schema changed
3. Test locally with fresh database
4. Deploy new container

### Option 3: Fresh Deploy (Nuclear Option)
1. Update seed data
2. Deploy to new environment
3. Migrate user data if needed
4. Switch traffic

## Guarding Against Accidental Seeding

The seeding guard uses:
```csharp
public async Task<bool> NeedsBootstrapAsync(CancellationToken ct)
{
    return !await _db.Films.AnyAsync(ct) && !await _db.People.AnyAsync(ct);
}
```

This prevents re-seeding on restarts while allowing seeding in fresh environments.

## IsActive Field

The `IsActive` field on starships remains in the schema but:
- Always `true` for catalog ships after seeding
- No retire/reactivate workflows exist
- Can be used for future filtering if needed

This provides flexibility without complexity.
