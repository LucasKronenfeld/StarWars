using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Data.Seeding;
using Tests.Integration.Fixtures;
using Tests.Integration.Helpers;

namespace Tests.Integration.Seeding;

/// <summary>
/// Tests for database seeding behavior.
/// Verifies one-time seeding, duplicate prevention, and catalog integrity.
/// These tests manage seeding manually and don't use the shared catalog.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "Seeding")]
public class SeedingTests : IAsyncLifetime
{
    private readonly PostgresContainerFixture _dbFixture;
    private StarWarsApiFactory _factory = null!;

    public SeedingTests(PostgresContainerFixture dbFixture)
    {
        _dbFixture = dbFixture;
    }

    public async Task InitializeAsync()
    {
        // Create factory WITHOUT auto-seeding but WITH snapshot for deterministic data
        // We'll control seeding manually with known snapshot data
        _factory = new StarWarsApiFactory(
            _dbFixture.ConnectionString, 
            enableSeeding: false,
            useSnapshot: true);

        // Clear all data for clean slate (including catalog)
        await DbResetHelper.ClearAllDataAsync(_factory.Services);
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Bootstrap_WhenDatabaseEmpty_SeedsCatalogData()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Verify database is empty
        var hasData = await db.Films.AnyAsync() || await db.People.AnyAsync();
        hasData.Should().BeFalse("database should be empty before seeding");

        // Act
        var result = await seeder.BootstrapAsync(CancellationToken.None);

        // Assert - Using snapshot data with known counts
        var filmsCount = await db.Films.CountAsync();
        var peopleCount = await db.People.CountAsync();
        var planetsCount = await db.Planets.CountAsync();
        var starshipsCount = await db.Starships.CountAsync(s => s.IsCatalog);
        var speciesCount = await db.Species.CountAsync();
        var vehiclesCount = await db.Vehicles.CountAsync();

        // Known counts from snapshot data (see SwapiSnapshot/README.md)
        filmsCount.Should().Be(2, "snapshot contains 2 films");
        peopleCount.Should().Be(2, "snapshot contains 2 people");
        planetsCount.Should().Be(2, "snapshot contains 2 planets");
        starshipsCount.Should().Be(3, "snapshot contains 3 starships");
        speciesCount.Should().Be(2, "snapshot contains 2 species");
        vehiclesCount.Should().Be(1, "snapshot contains 1 vehicle");
    }

    [Fact]
    public async Task Bootstrap_WhenDatabaseHasData_SkipsSeeding()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // First seed
        await seeder.BootstrapAsync(CancellationToken.None);
        var initialStarshipCount = await db.Starships.CountAsync(s => s.IsCatalog);

        // Act - try to seed again
        var result = await seeder.BootstrapAsync(CancellationToken.None);

        // Assert
        var finalStarshipCount = await db.Starships.CountAsync(s => s.IsCatalog);
        finalStarshipCount.Should().Be(initialStarshipCount, "re-seeding should not create duplicates");
    }

    [Fact]
    public async Task NeedsBootstrap_WhenDatabaseEmpty_ReturnsTrue()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();

        // Act
        var needsBootstrap = await seeder.NeedsBootstrapAsync(CancellationToken.None);

        // Assert
        needsBootstrap.Should().BeTrue();
    }

    [Fact]
    public async Task NeedsBootstrap_WhenDatabaseHasFilms_ReturnsFalse()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Seed first
        await seeder.BootstrapAsync(CancellationToken.None);

        // Act
        var needsBootstrap = await seeder.NeedsBootstrapAsync(CancellationToken.None);

        // Assert
        needsBootstrap.Should().BeFalse();
    }

    [Fact]
    public async Task CatalogStarships_HaveCorrectSourceAndSourceKey()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await seeder.BootstrapAsync(CancellationToken.None);

        // Act
        var catalogStarships = await db.Starships
            .Where(s => s.IsCatalog)
            .ToListAsync();

        // Assert
        catalogStarships.Should().NotBeEmpty();
        
        foreach (var starship in catalogStarships)
        {
            starship.Source.Should().NotBeNullOrWhiteSpace("catalog starship should have Source");
            starship.SourceKey.Should().NotBeNullOrWhiteSpace("catalog starship should have SourceKey");
            starship.IsCatalog.Should().BeTrue();
            starship.IsActive.Should().BeTrue();
            starship.OwnerUserId.Should().BeNull("catalog starship should not have owner");
        }
    }

    [Fact]
    public async Task CatalogStarships_HaveUniqueSourceKeyPerSource()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await seeder.BootstrapAsync(CancellationToken.None);

        // Act
        var catalogStarships = await db.Starships
            .Where(s => s.IsCatalog && s.Source != null && s.SourceKey != null)
            .Select(s => new { s.Source, s.SourceKey })
            .ToListAsync();

        // Assert
        var duplicates = catalogStarships
            .GroupBy(x => new { x.Source, x.SourceKey })
            .Where(g => g.Count() > 1)
            .ToList();

        duplicates.Should().BeEmpty("each (Source, SourceKey) combination should be unique");
    }

    [Fact]
    public async Task AllCatalogEntities_HaveSourceIdentity()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await seeder.BootstrapAsync(CancellationToken.None);

        // Act & Assert - Films
        var films = await db.Films.ToListAsync();
        films.Should().AllSatisfy(f =>
        {
            f.Source.Should().NotBeNullOrWhiteSpace();
            f.SourceKey.Should().NotBeNullOrWhiteSpace();
        });

        // Act & Assert - People
        var people = await db.People.ToListAsync();
        people.Should().AllSatisfy(p =>
        {
            p.Source.Should().NotBeNullOrWhiteSpace();
            p.SourceKey.Should().NotBeNullOrWhiteSpace();
        });

        // Act & Assert - Planets
        var planets = await db.Planets.ToListAsync();
        planets.Should().AllSatisfy(p =>
        {
            p.Source.Should().NotBeNullOrWhiteSpace();
            p.SourceKey.Should().NotBeNullOrWhiteSpace();
        });

        // Act & Assert - Species
        var species = await db.Species.ToListAsync();
        species.Should().AllSatisfy(s =>
        {
            s.Source.Should().NotBeNullOrWhiteSpace();
            s.SourceKey.Should().NotBeNullOrWhiteSpace();
        });

        // Act & Assert - Vehicles
        var vehicles = await db.Vehicles.ToListAsync();
        vehicles.Should().AllSatisfy(v =>
        {
            v.Source.Should().NotBeNullOrWhiteSpace();
            v.SourceKey.Should().NotBeNullOrWhiteSpace();
        });
    }

    [Fact]
    public async Task Seed_DoesNotCreateDuplicates_WhenCalledMultipleTimes()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // First seed
        await seeder.SeedAsync(force: false, CancellationToken.None);
        var countsAfterFirst = await GetEntityCounts(db);

        // Act - second seed (no force)
        await seeder.SeedAsync(force: false, CancellationToken.None);
        var countsAfterSecond = await GetEntityCounts(db);

        // Assert
        countsAfterSecond.Films.Should().Be(countsAfterFirst.Films);
        countsAfterSecond.People.Should().Be(countsAfterFirst.People);
        countsAfterSecond.Planets.Should().Be(countsAfterFirst.Planets);
        countsAfterSecond.Starships.Should().Be(countsAfterFirst.Starships);
        countsAfterSecond.Species.Should().Be(countsAfterFirst.Species);
        countsAfterSecond.Vehicles.Should().Be(countsAfterFirst.Vehicles);
    }

    [Fact]
    public async Task CatalogFilms_HaveExpectedProperties()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await seeder.BootstrapAsync(CancellationToken.None);

        // Act
        var films = await db.Films.ToListAsync();

        // Assert
        films.Should().NotBeEmpty();
        films.Should().AllSatisfy(f =>
        {
            f.Title.Should().NotBeNullOrWhiteSpace("film should have a title");
            f.EpisodeId.Should().BeGreaterThanOrEqualTo(0);
        });

        // Snapshot contains 2 films
        films.Count.Should().BeGreaterThanOrEqualTo(2, "snapshot should have at least 2 Star Wars films");
    }

    [Fact]
    public async Task CatalogPeople_HaveRelationships()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await seeder.BootstrapAsync(CancellationToken.None);

        // Act - Check that some people have homeworlds
        var peopleWithHomeworlds = await db.People
            .Where(p => p.HomeworldId != null)
            .CountAsync();

        // Assert
        peopleWithHomeworlds.Should().BeGreaterThan(0, "some people should have homeworld relationships");
    }

    private static async Task<(int Films, int People, int Planets, int Starships, int Species, int Vehicles)> GetEntityCounts(ApplicationDbContext db)
    {
        return (
            Films: await db.Films.CountAsync(),
            People: await db.People.CountAsync(),
            Planets: await db.Planets.CountAsync(),
            Starships: await db.Starships.CountAsync(s => s.IsCatalog),
            Species: await db.Species.CountAsync(),
            Vehicles: await db.Vehicles.CountAsync()
        );
    }
}
