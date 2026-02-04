# Quick Diff Summary - Star Wars API Refactoring

## What Changed? (TL;DR)

### 🎯 Main Goal
Make the app Docker/Azure ready with production-safe seeding that never duplicates data or wipes user info.

---

## 🔑 Key Concepts

### Before:
- Seeding: "Wipe everything and reload from SWAPI"
- Admin endpoint: Required special key + role
- No way to extend SWAPI data without editing code
- Not Docker-friendly (manual seeding required)

### After:
- Seeding: "Upsert catalog, keep user data intact"
- Admin endpoints: Role-based, production-safe sync + dev-only wipe
- Extended JSON: Add custom films/planets/etc. via JSON files
- Docker-ready: Auto-seed on first run, idempotent

---

## 📊 Database Changes

### New Fields (All Catalog Tables)
```csharp
// All catalog entities (Film, Person, Planet, Species, Starship, Vehicle)
public string Source { get; set; }     // "swapi" or "extended"
public string SourceKey { get; set; }  // Unique ID within source
```

### New Indexes
```sql
-- Prevents duplicates across sources
CREATE UNIQUE INDEX ON Films (Source, SourceKey);
CREATE UNIQUE INDEX ON People (Source, SourceKey);
CREATE UNIQUE INDEX ON Planets (Source, SourceKey);
CREATE UNIQUE INDEX ON Species (Source, SourceKey);
CREATE UNIQUE INDEX ON Starships (Source, SourceKey);
CREATE UNIQUE INDEX ON Vehicles (Source, SourceKey);
```

### Migration
```bash
dotnet ef migrations add AddDataSourceIdentity
dotnet ef database update
```

---

## 🔧 Code Changes

### DatabaseSeeder.cs (Complete Rewrite)

**Before**:
```csharp
public async Task<object> SyncCatalogAsync()
{
    // Load all SWAPI starships
    // For each:
    //   - Find by SwapiUrl
    //   - Update if exists, insert if not
    // Retire missing ones
}

public async Task<object> SeedAsync(bool force)
{
    if (force) {
        // DELETE EVERYTHING
    }
    // Insert all SWAPI data
}
```

**After**:
```csharp
public async Task<object> BootstrapAsync()
{
    // Check if DB empty -> seed if needed
}

public async Task<object> SyncCatalogAsync()
{
    // Stage 1: Upsert SWAPI (all entities)
    // Stage 2: Upsert Extended JSON
    // Stage 3: Retire missing SWAPI ships
}

public async Task<object> SeedAsync(bool force)
{
    if (force) {
        // Dev-only: wipe catalog + user data
    }
    await SyncCatalogAsync();
}
```

### AdminController.cs

**Before**:
```csharp
[HttpPost("seed")]
public async Task<IActionResult> Seed(
    bool force = false, 
    bool catalogOnly = false)
{
    // Complex logic for dev vs prod
    // Requires X-SEED-KEY header
    // Confusing parameters
}
```

**After**:
```csharp
// Production-safe sync
[HttpPost("sync-catalog")]
public async Task<IActionResult> SyncCatalog()
{
    // Just sync, no wipe risk
}

// Dev-only wipe
[HttpPost("dev-wipe-reseed")]
public async Task<IActionResult> DevWipeReseed()
{
    if (!_env.IsDevelopment()) 
        return Forbid();
    // Full wipe
}

// Environment check for frontend
[HttpGet("environment")]
public IActionResult GetEnvironment()
{
    return Ok(new { 
        environment = _env.EnvironmentName,
        isDevelopment = _env.IsDevelopment()
    });
}
```

### Program.cs

**Before**:
```csharp
var app = builder.Build();

// Manual role bootstrap
await BootstrapAdminRoleAsync(app);

app.Run();
```

**After**:
```csharp
var app = builder.Build();

// Auto-migrate database
if (config["Database:AutoMigrate"] == true) {
    await db.Database.MigrateAsync();
}

// Bootstrap admin role
await BootstrapAdminRoleAsync(app);

// Auto-seed if DB empty
if (config["Seed:AutoBootstrap"] == true) {
    await seeder.BootstrapAsync();
}

// Health endpoint
app.MapGet("/health", () => Results.Ok(new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow 
}));

app.Run();
```

---

## 🆕 New Features

### 1. Extended JSON Support

Create files in `Data/Extended/`:

**films.json**:
```json
{
  "data": [
    {
      "id": "rogue-one",
      "title": "Rogue One: A Star Wars Story",
      "episodeId": 3.5,
      "director": "Gareth Edwards",
      "releaseDate": "2016-12-16",
      "characters": ["https://swapi.dev/api/people/14/"],
      "starships": []
    }
  ]
}
```

**Merge into existing SWAPI entity**:
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
☝️ This updates the existing Han Solo, doesn't create a new one!

### 2. Docker Support

**docker-compose.yml**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: starwars
      POSTGRES_PASSWORD: starwars_dev_password
      POSTGRES_DB: starwars
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  api:
    build: ./Server/StarWarsApi.Server
    environment:
      ConnectionStrings__DefaultConnection: "Host=postgres;..."
      Jwt__Key: "your-secret-key-here"
      Seed__AutoBootstrap: "true"
      Seed__UseExtendedJson: "true"
      Seed__AdminEmails__0: "admin@starwars.local"
    ports:
      - "8080:8080"
    depends_on:
      - postgres
```

Run:
```bash
docker-compose up --build
# Database auto-migrates
# Catalog auto-seeds (if empty)
# API ready on port 8080
```

### 3. Updated Frontend Admin Page

**Before**:
- One "Sync Catalog" button
- Required seed key input
- No environment awareness

**After**:
- "Sync Catalog" button (always visible)
- "Dev Tools" section (only in dev mode)
  - Seed key input (optional)
  - "Wipe & Reseed Database" with confirmation
- Environment detection from backend

---

## 🚫 Breaking Changes

| What | Before | After |
|------|--------|-------|
| **Endpoint** | `POST /api/admin/seed?force=&catalogOnly=` | `POST /api/admin/sync-catalog` (safe)<br>`POST /api/admin/dev-wipe-reseed` (dev-only) |
| **Auth** | Required X-SEED-KEY header | Admin JWT role only |
| **Database** | No Source/SourceKey fields | **Required**: Run migration |
| **Config** | `Seed:AllowCatalogSyncInProduction` | **Removed** (not needed) |
| **Config** | No auto-migrate/bootstrap settings | **New**: `Database:AutoMigrate`, `Seed:AutoBootstrap` |

---

## ✅ Migration Steps

### Local Development:
```bash
# 1. Pull changes
git pull

# 2. Restore packages
cd Server/StarWarsApi.Server
dotnet restore

# 3. Apply migration
dotnet ef database update

# 4. Run
dotnet run
```

### Docker:
```bash
# Just run - everything auto-configures
docker-compose up --build
```

---

## 📈 Improvements Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Duplicates** | Possible with manual seeding | Impossible (unique indexes) |
| **User Data** | Wiped on reseed | Always preserved in prod |
| **Extended Data** | Manual code changes | JSON files |
| **Docker** | Manual setup | Auto-seed on first run |
| **Idempotency** | No (wipe & reload) | Yes (upsert) |
| **Production Safety** | Requires careful config | Safe by default |
| **Admin UI** | One button for all | Separate safe/unsafe actions |

---

## 🎬 Quick Demo

### Scenario: Add a New Film (Rogue One)

**Before** (old system):
1. Write SQL INSERT or C# code
2. Manually add relationships
3. Risk of duplicates if SWAPI adds it later
4. Deploy code change

**After** (new system):
1. Create `Data/Extended/films.json`:
   ```json
   {
     "data": [{
       "id": "rogue-one",
       "title": "Rogue One: A Star Wars Story",
       "episodeId": 3.5,
       "characters": ["https://swapi.dev/api/people/14/"]
     }]
   }
   ```
2. Call `POST /api/admin/sync-catalog`
3. Done! Film appears with relationships
4. If SWAPI ever adds Rogue One, no duplicate (different SourceKey)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `REFACTORING_SUMMARY.md` | Complete detailed documentation (15+ pages) |
| `SMOKE_TESTS.md` | Quick test commands and troubleshooting |
| `DIFF_SUMMARY.md` | This file - quick overview |

---

## 🆘 Most Common Questions

**Q: Will my existing data be lost?**
A: No. Migration adds new fields with defaults. Existing data preserved.

**Q: Can I still do full wipe & reseed in development?**
A: Yes. Use `POST /api/admin/dev-wipe-reseed` (requires dev environment).

**Q: How do I add custom films/planets?**
A: Create JSON files in `Data/Extended/` and call sync-catalog.

**Q: What if extended JSON references a SWAPI entity?**
A: Use the entity's SWAPI URL in relationship arrays. It will link correctly.

**Q: What if I want to update an existing SWAPI entity?**
A: Use `sameAs` field pointing to SWAPI URL. It will merge your changes.

**Q: Is Docker required?**
A: No. The app runs fine without Docker. Docker just makes deployment easier.

**Q: What happens on first Docker run with empty database?**
A: Auto-migrates → Auto-seeds SWAPI → Auto-seeds extended JSON → Ready.

**Q: What happens on subsequent Docker runs?**
A: Skips seeding (data exists) → Ready immediately.

**Q: Can I run sync-catalog multiple times safely?**
A: Yes. It's idempotent. Won't create duplicates or wipe data.

---

## ✨ Bottom Line

**Old way**: "Wipe everything and reload" (dangerous)
**New way**: "Update what's changed, keep what exists" (safe)

**Result**: Docker-ready, production-safe, extendable, idempotent! 🚀
