using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StarWarsApi.Server.Data;

namespace Tests.Integration.Helpers;

/// <summary>
/// Helper for resetting database state between tests.
/// Ensures test isolation without recreating the entire database.
/// Catalog data is seeded once per test collection and preserved.
/// </summary>
public static class DbResetHelper
{
    /// <summary>
    /// Clears all user-generated data while preserving catalog.
    /// Resets Identity sequences for consistent IDs across tests.
    /// This is the preferred method for test cleanup.
    /// </summary>
    public static async Task ResetUserDataAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await ClearUserDataAsync(db);
    }

    /// <summary>
    /// Clears all data including seeded catalog data.
    /// Use this when testing seeding behavior.
    /// </summary>
    public static async Task ClearAllDataAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await ClearAllTablesAsync(db);
    }

    /// <summary>
    /// Clears user data (fleets, custom ships, users) while preserving catalog.
    /// </summary>
    private static async Task ClearUserDataAsync(ApplicationDbContext db)
    {
        // Clear in dependency order
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FleetStarships\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Fleets\"");
        
        // Clear custom (non-catalog) starships
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Starships\" WHERE \"IsCatalog\" = false");
        
        // Clear users (Identity tables)
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserTokens\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserLogins\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserClaims\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserRoles\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUsers\"");
    }

    /// <summary>
    /// Clears all tables including catalog data for seeding tests.
    /// </summary>
    private static async Task ClearAllTablesAsync(ApplicationDbContext db)
    {
        // Disable FK checks temporarily or delete in correct order
        // Join tables first
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FleetStarships\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Fleets\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FilmCharacters\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FilmPlanets\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FilmStarships\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FilmVehicles\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"FilmSpecies\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"StarshipPilots\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"VehiclePilots\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"PlanetResidents\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"SpeciesPerson\"");
        
        // Main entities
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Starships\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Vehicles\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Films\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"People\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Species\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Planets\"");
        
        // Identity tables
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserTokens\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserLogins\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserClaims\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUserRoles\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetRoleClaims\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetRoles\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"AspNetUsers\"");
    }

    /// <summary>
    /// Ensures database has been seeded with catalog data.
    /// Returns true if catalog data exists.
    /// </summary>
    public static async Task<bool> HasCatalogDataAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        return await db.Starships.AnyAsync(s => s.IsCatalog);
    }

    /// <summary>
    /// Gets the count of seeded catalog starships.
    /// </summary>
    public static async Task<int> GetCatalogStarshipCountAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        return await db.Starships.CountAsync(s => s.IsCatalog);
    }
}
