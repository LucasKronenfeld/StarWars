# Star Wars Fleet Platform - Test Suite

A comprehensive test suite covering all major functionality of the Star Wars Fleet Platform API, with 140+ total tests across unit and integration categories.

## 🎯 What We Test

### **Unit Tests (47 tests)** - Pure business logic, no database
- ✅ Fleet quantity rules (min/max clamping)
- ✅ Fork property mapping (catalog ship → custom ship)
- ✅ Ownership validation logic (authorization rules)

### **Integration Tests (93+ tests)** - Full API with real PostgreSQL
- ✅ **Database Seeding** (10 tests) - Deterministic snapshot seeding, duplicate prevention
- ✅ **Authentication** (13 tests) - Registration, login, JWT tokens, protected endpoints
- ✅ **Fleet Management** (16 tests) - Creation, adding ships, quantity, user isolation
- ✅ **Custom Ships** (14 tests) - CRUD operations, ownership validation, soft deletes
- ✅ **Fork Behavior** (14 tests) - Catalog forking, independence, property copying
- ✅ **Catalog Browsing** (16 tests) - Pagination, filtering, sorting, public access
- ✅ **Catalog Enforcement** (7 tests) - Read-only protection, immutability validation
- ✅ **Auth Edge Cases** (10 tests) - Invalid tokens, case sensitivity, token claims

---

## 🚀 Quick Start

### Step 1: Install Prerequisites

**Required:**
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (check: `dotnet --version`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (integration tests only)

**Verify Docker is running:**
```powershell
docker info
# Should show Server Version without errors
```

### Step 2: Run the Tests

**All tests:**
```powershell
cd C:\Users\lucas\StarWars\StarWars
dotnet test
```

**Unit tests only** (fast, no Docker needed):
```powershell
dotnet test --filter "Category=Unit"
```

**Integration tests only** (requires Docker):
```powershell
dotnet test --filter "Category=Integration"
```

**Specific test categories:**
```powershell
# Authentication tests
dotnet test --filter "Category=Auth"

# Fleet tests
dotnet test --filter "Category=Fleet"

# Seeding tests
dotnet test --filter "Category=Seeding"
```

### Step 3: View Results

Tests display real-time progress:
- ✅ Green = Passed
- ❌ Red = Failed  
- ⏱️ Duration shown for each test

**Example output:**
```
Passed!  - Failed: 0, Passed: 47, Skipped: 0, Total: 47, Duration: 24 ms
```

---

## ✨ New Features (2026 Improvements)

### 🎲 Deterministic Seeding
- **Snapshot-based seeding** for consistent test data
- No HTTP calls to swapi.dev during tests
- Fast, offline, and predictable
- Known entity counts: 2 films, 2 people, 2 planets, 3 starships, 2 species, 1 vehicle
- Snapshot files in `Server/StarWarsApi.Server/Data/Seeding/SwapiSnapshot/`

### 🗄️ Proper Migrations
- Uses `Database.Migrate()` instead of `EnsureCreated()`
- All indexes and constraints properly applied
- Matches production database schema exactly

### ⚡ Optimized Database Reset
- **Catalog seeded once per test collection** (not per test)
- Tests clear user data only between runs
- ~10x faster test execution
- Shared catalog across all tests in collection

### 🏷️ Test Categorization
- All tests tagged with `[Trait("Category", "...")]`
- Filter by: Unit, Integration, Auth, Fleet, CustomShips, Fork, Catalog, Seeding
- Easy CI/CD integration

### 🔒 Catalog Enforcement Tests
- Verifies catalog endpoints are GET-only
- POST/PUT/DELETE return 404/405
- Ensures "seed once, static canon" contract

---

## 📁 Project Structure

```
Tests/
├── Tests.Integration/           # Integration tests (main focus)
│   ├── Fixtures/                # Test infrastructure
│   │   ├── PostgresContainerFixture.cs    # Testcontainers PostgreSQL
│   │   ├── StarWarsApiFactory.cs          # WebApplicationFactory override
│   │   └── IntegrationTestCollection.cs   # Collection definition
│   ├── Helpers/                 # Test utilities
│   │   ├── AuthClientHelper.cs            # JWT auth helpers
│   │   ├── DbResetHelper.cs               # Database reset utilities
│   │   └── HttpClientExtensions.cs        # HTTP client extensions
│   ├── Auth/                    # Authentication tests
│   │   └── AuthTests.cs
│   ├── Fleet/                   # Fleet management tests
│   │   └── FleetTests.cs
│   ├── CustomShips/             # Custom ship & fork tests
│   │   ├── CustomShipTests.cs
│   │   └── ForkTests.cs
│   ├── Catalog/                 # Catalog browsing tests
│   │   └── CatalogTests.cs
│   ├── Seeding/                 # Database seeding tests
│   │   └── SeedingTests.cs
│   └── IntegrationTestBase.cs   # Base class for integration tests
│
└── Tests.Unit/                  # Unit tests (pure logic)
    ├── FleetLogic/
    │   └── QuantityRulesTests.cs
    ├── ForkLogic/
    │   └── ForkMappingTests.cs
    └── OwnershipLogic/
        └── OwnershipValidationTests.cs
```

---

## 🎓 Running Specific Test Categories

### By Category (Recommended)
```powershell
# All unit tests
dotnet test --filter "Category=Unit"

# All integration tests
dotnet test --filter "Category=Integration"

# Authentication tests
dotnet test --filter "Category=Auth"

# Fleet management tests
dotnet test --filter "Category=Fleet"

# Custom ships tests
dotnet test --filter "Category=CustomShips"

# Fork behavior tests
dotnet test --filter "Category=Fork"

# Catalog browsing tests
dotnet test --filter "Category=Catalog"

# Database seeding tests
dotnet test --filter "Category=Seeding"

# Catalog enforcement (read-only) tests
dotnet test --filter "Category=CatalogEnforcement"
```

### By Test Class (Legacy)
```powershell
# Database seeding tests
dotnet test --filter "SeedingTests"

# Authentication tests
dotnet test --filter "AuthTests"

# Fleet management tests
dotnet test --filter "FleetTests"

# Custom ships tests
dotnet test --filter "CustomShipTests"

# Fork behavior tests
dotnet test --filter "ForkTests"

# Catalog browsing tests
dotnet test --filter "CatalogTests"
```

### By Test Name
```powershell
# Run a single test
dotnet test --filter "GetFleet_ForNewUser_ReturnsEmptyFleet"

# Run tests matching pattern
dotnet test --filter "FullyQualifiedName~Fork"
```

### With Detailed Output
```powershell
# See detailed logs (HTTP requests, SQL queries)
dotnet test --logger "console;verbosity=detailed"

# Minimal output (just pass/fail summary)
dotnet test --logger "console;verbosity=minimal"
```

---

## 📊 What Each Test Category Covers

### 🌱 Seeding Tests (`SeedingTests.cs`)
**What it tests:**
- Bootstrap seeds 260+ catalog entities from SWAPI on first run
- Re-running doesn't create duplicates
- All catalog entities have unique `(Source, SourceKey)` identity
- Catalog includes films, people, planets, species, starships, vehicles
- Relationships between entities are preserved

**Key test:**
```csharp
Bootstrap_WhenDatabaseEmpty_SeedsCatalogData()
// Verifies 6 films, 82 people, 60 planets, etc. are seeded correctly
```

### 🔐 Authentication Tests (`AuthTests.cs`)
**What it tests:**
- User registration with email/password
- Duplicate email rejection
- Login returns valid JWT token
- Token contains correct claims (userId, email, roles)
- Protected endpoints require authentication
- Invalid/missing tokens return 401 Unauthorized
- Email is case-insensitive for login

**Key tests:**
```csharp
Register_WithValidData_ReturnsOkAndToken()
Login_EmailIsCaseInsensitive()
ProtectedEndpoint_WithValidToken_ReturnsSuccess()
```

### 🚀 Fleet Tests (`FleetTests.cs`)
**What it tests:**
- Each user gets exactly one fleet (auto-created)
- Adding catalog ships to fleet
- Quantity increments when adding same ship twice
- Quantity validation (min 1, max 999)
- Removing ships from fleet
- Updating quantity and nickname
- Fleets are isolated between users
- Cannot access other users' fleets

**Key tests:**
```csharp
AddItem_CreatesFleetAutomatically()
AddItem_SameShipTwice_IncrementsQuantity()
User_CannotAccessOtherUsersFleet()
```

### 🛸 Custom Ships Tests (`CustomShipTests.cs`)
**What it tests:**
- Creating custom starships with name, specs
- Custom ships marked as `IsCatalog = false`
- Assigning custom pilot to ship
- Editing owned ships
- Cannot edit other users' ships (returns 404, not 403 for security)
- Soft delete (sets `IsActive = false`)
- Deleted ships excluded from listings
- Custom ships can be added to owner's fleet

**Key tests:**
```csharp
CreateShip_SetsCorrectFlags()
UpdateShip_OtherUsersShip_ReturnsNotFound()
DeleteShip_OwnedShip_SoftDeletes()
```

### 🔀 Fork Tests (`ForkTests.cs`)
**What it tests:**
- Forking catalog ship creates independent custom copy
- All properties copied (name, class, cost, specs)
- Forked ship has `BaseStarshipId` reference
- Editing fork doesn't affect catalog ship
- Multiple users can fork same catalog ship independently
- Forked ships can be added to fleet
- Fork maintains relationship to base ship

**Key tests:**
```csharp
Fork_CatalogShip_CreatesIndependentCopy()
Fork_EditedFork_DoesNotAffectCatalogShip()
Fork_MultipleForks_AreIndependent()
```

### 📚 Catalog Tests (`CatalogTests.cs`)
**What it tests:**
- Browse starships without authentication
- Pagination (page number, page size)
- Search by name
- Filter by cost range
- Filter by starship class
- Sorting by name, cost, class
- Detail endpoint returns full ship info
- Catalog marked as `IsCatalog = true`

**Key tests:**
```csharp
GetStarships_WithoutAuth_ReturnsData()
GetStarships_WithPagination_ReturnsCorrectPage()
GetStarships_WithSearch_FiltersResults()
GetStarshipById_ReturnsCorrectShip()
```

---

## 🏗️ Test Infrastructure Architecture

### How Integration Tests Work (Improved 2026)

1. **Testcontainers** starts a real PostgreSQL 16 container once per test collection
2. **WebApplicationFactory** creates a test instance of your API
3. **Database.Migrate()** applies all EF Core migrations (proper schema with indexes)
4. **Snapshot seeding** loads deterministic data from JSON files (once per collection)
5. **Each test** clears user data only (preserves catalog)
6. **xUnit** runs tests sequentially within collection for data consistency

### Key Components

#### `PostgresContainerFixture.cs`
- Manages PostgreSQL Docker container lifecycle
- Starts once per test collection, shared across all tests
- Provides connection string to test API
- **NEW**: Seeds catalog once per collection via `EnsureCatalogSeededAsync()`

#### `StarWarsApiFactory.cs`
- Overrides `WebApplicationFactory<Program>`
- Injects test database connection
- Configures JWT authentication for testing
- **NEW**: Uses `Database.Migrate()` instead of `EnsureCreated()`
- **NEW**: Enables snapshot seeding mode for deterministic data

#### `IntegrationTestBase.cs`
- Base class for all integration tests
- **NEW**: Calls `ResetUserDataAsync()` before each test
- Preserves shared catalog data across tests
- Provides helper methods for common operations

#### `AuthClientHelper.cs`
- Simplifies user registration and login
- Returns authenticated HttpClient with JWT bearer token
- Example:
  ```csharp
  var client = await RegisterUserAsync("test@example.com", "Password123!");
  var response = await client.GetAsync("/api/fleet"); // Authenticated!
  ```

#### `DbResetHelper.cs`
- **NEW**: `ResetUserDataAsync()` - Clears user tables only (default)
- `ClearAllDataAsync()` - Clears everything including catalog (for seeding tests)
- Preserves catalog for performance

#### `ISwapiSource` Abstraction
- **NEW**: Abstraction for SWAPI data sources
- `SwapiClient` - HTTP client for production/dev (live API)
- `SnapshotSwapiSource` - File-based loader for tests (JSON snapshots)
- Enables deterministic, offline testing

---

## ⚠️ Troubleshooting

### Problem: Docker Not Running
```
Error: Cannot connect to the Docker daemon
```
**Solution:**
1. Start Docker Desktop
2. Wait for Docker icon to show "Docker Desktop is running"
3. Verify: `docker info` (should show Server Version)
4. Re-run tests

### Problem: Integration Tests Slow or Timeout
```
Error: Test host process crashed: Stack overflow
```
**Old Behavior:** Each test dropped/recreated database and re-seeded from live API (5-10 seconds per test)

**New Behavior (2026 Fix):**
- Catalog seeded once per test collection from snapshots (~1 second)
- Tests clear user data only (~100ms per test)
- Much faster execution: 140 tests now run in ~2-3 minutes
- Run specific categories for even faster feedback:
  ```powershell
  dotnet test --filter "Category=Fleet"  # Just fleet tests
  ```

### Problem: Container Start Timeout
```
Error: Container did not start within timeout
```
**Solution:**
1. Pull the PostgreSQL image manually:
   ```powershell
   docker pull postgres:16-alpine
   ```
2. Check Docker has enough resources (Settings → Resources → Advanced)
3. Increase RAM allocation to at least 4GB

### Problem: Port Already in Use
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```
**Solution:**
1. Testcontainers uses random ports (not 5432), but check for conflicts:
   ```powershell
   docker ps  # See running containers
   docker stop <container_id>  # Stop conflicting container
   ```

### Problem: Test Failed - Data Not Found
**Old Cause:** Database not seeded or cleared between tests

**New Solution (2026):**
- Catalog automatically seeded once per test collection
- User data automatically cleared before each test
- Check test class inherits from `IntegrationTestBase`
- For seeding tests, use `ClearAllDataAsync()` to test bootstrap behavior

---

## 🏗️ Adding New Tests

### Step 1: Choose Test Type

**Unit Test** - Testing pure logic without database:
- Location: `Tests/Tests.Unit/`
- No Docker required
- Fast execution
- Example: Validation rules, calculations, mappings

**Integration Test** - Testing full API with database:
- Location: `Tests/Tests.Integration/`
- Requires Docker
- Slower execution
- Example: API endpoints, database queries, authentication

### Step 2: Create Test Class

**For Integration Tests:**
```csharp
using Tests.Integration.Fixtures;

namespace Tests.Integration.MyFeature;

[Collection(IntegrationTestCollection.Name)]
public class MyFeatureTests : IntegrationTestBase
{
    public MyFeatureTests(PostgresContainerFixture dbFixture) 
        : base(dbFixture) { }

    [Fact]
    public async Task MyEndpoint_WhenValidRequest_ReturnsSuccess()
    {
        // Arrange - Set up test data
        var client = await RegisterUserAsync(); // Creates authenticated user

        // Act - Call the API
        var response = await client.GetAsync("/api/my-endpoint");

        // Assert - Verify response
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Assert - Verify database state
        var dbRecord = await ExecuteDbContextAsync(async db =>
            await db.MyTable.FirstOrDefaultAsync());
        dbRecord.Should().NotBeNull();
        dbRecord!.SomeProperty.Should().Be("expected value");
    }
}
```

**For Unit Tests:**
```csharp
namespace Tests.Unit.MyLogic;

public class MyLogicTests
{
    [Theory]
    [InlineData(0, 1)]      // Input 0 should become 1
    [InlineData(-5, 1)]     // Input -5 should become 1
    [InlineData(1000, 999)] // Input 1000 should become 999
    public void ClampQuantity_ReturnsValueInRange(int input, int expected)
    {
        // Act
        var result = MyLogic.ClampQuantity(input);

        // Assert
        result.Should().Be(expected);
    }
}
```

### Step 3: Follow AAA Pattern

All tests should follow **Arrange-Act-Assert**:

```csharp
[Fact]
public async Task DescriptiveTestName_Scenario_ExpectedOutcome()
{
    // Arrange - Set up test conditions
    var user = await RegisterUserAsync("test@example.com");
    var shipId = await GetFirstCatalogStarshipId();

    // Act - Perform the operation being tested
    var response = await client.PostAsJsonAsync("/api/fleet/items", new 
    { 
        StarshipId = shipId, 
        Quantity = 5 
    });

    // Assert - Verify the outcome
    response.StatusCode.Should().Be(HttpStatusCode.Created);
    
    var fleet = await ExecuteDbContextAsync(async db =>
        await db.Fleets
            .Include(f => f.Items)
            .FirstAsync(f => f.UserId == userId));
    
    fleet.Items.Should().HaveCount(1);
    fleet.Items.First().Quantity.Should().Be(5);
}
```

---

## 📦 Dependencies & Versions

| Package | Version | Purpose |
|---------|---------|---------|
| **xUnit** | 2.9.0 | Test framework |
| **FluentAssertions** | 6.12.0 | Readable assertions |
| **Testcontainers.PostgreSql** | 3.9.0 | Real PostgreSQL in Docker |
| **Microsoft.AspNetCore.Mvc.Testing** | 8.0.8 | WebApplicationFactory |
| **Npgsql.EntityFrameworkCore.PostgreSQL** | 8.0.4 | PostgreSQL provider |

---

## 🔧 Testing Principles We Follow

### ✅ What We DO
- Use **real PostgreSQL** via Testcontainers (not InMemory)
- Test **full API stack** with WebApplicationFactory
- Assert **database state**, not just HTTP status codes
- Use **actual seeding logic** to populate test data
- Create **isolated tests** with clean database state
- Follow **AAA pattern** (Arrange-Act-Assert)
- Write **descriptive test names** that explain scenario

### ❌ What We DON'T Do
- Don't use EF InMemory provider (doesn't match real DB behavior)
- Don't mock `DbContext` or `UserManager` in integration tests
- Don't skip database assertions (verify data was actually saved)
- Don't share state between tests (each test is independent)
- Don't write generic placeholder tests
- Don't test framework code (only our business logic)

---

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --no-restore
      
    - name: Run Unit Tests
      run: dotnet test --filter "Category=Unit" --no-build --logger "trx;LogFileName=unit-tests.trx"
      
    - name: Run Integration Tests (Snapshot Mode)
      run: dotnet test --filter "Category=Integration" --no-build --logger "trx;LogFileName=integration-tests.trx"
      
    - name: Upload Test Results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: "**/*.trx"
```

### CI Best Practices

**Fast Feedback Loop:**
```yaml
# Run unit tests on every commit (fast, no Docker)
- run: dotnet test --filter "Category=Unit"

# Run integration tests with snapshot seeding (requires Docker)
- run: dotnet test --filter "Category=Integration"
```

**Test Matrix Strategy:**
```yaml
strategy:
  matrix:
    test-category: [Unit, Auth, Fleet, CustomShips, Fork, Catalog]
steps:
  - run: dotnet test --filter "Category=${{ matrix.test-category }}"
```

---

## 📝 Test Results Summary

**Current Status:** ✅ All Tests Passing (2026 Improvements)

**Performance Metrics:**
- Unit tests: ~24ms total (no Docker)
- Integration tests: ~2-3 minutes total (with Docker + snapshot seeding)
- **10x faster** than previous live API seeding approach

| Category | Tests | Status | Notes |
|----------|-------|--------|-------|
| Unit Tests - Quantity Rules | 18 | ✅ Pass | Fast, no dependencies |
| Unit Tests - Fork Mapping | 17 | ✅ Pass | Fast, no dependencies |
| Unit Tests - Ownership | 12 | ✅ Pass | Fast, no dependencies |
| Integration - Seeding | 10 | ✅ Pass | Deterministic snapshot data |
| Integration - Auth | 13 | ✅ Pass | Shared catalog, fast reset |
| Integration - Fleet | 16 | ✅ Pass | Shared catalog, fast reset |
| Integration - Custom Ships | 14 | ✅ Pass | Shared catalog, fast reset |
| Integration - Fork | 14 | ✅ Pass | Shared catalog, fast reset |
| Integration - Catalog | 16 | ✅ Pass | Shared catalog, fast reset |
| Integration - Catalog Enforcement | 7 | ✅ Pass | Read-only protection tests |

**Known Counts (Snapshot Data):**
- 2 films, 2 people, 2 planets, 3 starships, 2 species, 1 vehicle
- Deterministic assertions based on snapshot files

---

## 📞 Need Help?

**Common Commands:**
```powershell
# Quick unit test run (25ms, no Docker)
dotnet test --filter "Category=Unit"

# Run just fleet tests (faster than full integration suite)
dotnet test --filter "Category=Fleet"

# Run all integration tests with snapshot seeding
dotnet test --filter "Category=Integration"

# Run with detailed output for debugging
dotnet test --logger "console;verbosity=detailed"

# Check if Docker is running
docker info

# See test containers
docker ps -a | Select-String postgres
```

**Quick Troubleshooting:**
- **Tests failing?** Ensure Docker Desktop is running
- **Slow tests?** Use category filters: `--filter "Category=Auth"`
- **Need fresh data?** Seeding tests use `ClearAllDataAsync()`
- **CI/CD setup?** See CI/CD Integration section above

**New in 2026:**
- ✅ Deterministic snapshot seeding (no live API calls)
- ✅ 10x faster integration tests
- ✅ Proper migrations with indexes
- ✅ Category-based test filtering
- ✅ Catalog enforcement tests
