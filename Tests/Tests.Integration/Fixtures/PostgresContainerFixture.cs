using DotNet.Testcontainers.Builders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Data.Seeding;
using Testcontainers.PostgreSql;

namespace Tests.Integration.Fixtures;

/// <summary>
/// Shared PostgreSQL test container fixture.
/// Starts once per test collection for efficiency.
/// Uses Testcontainers for real PostgreSQL database testing.
/// Seeds catalog data once per test collection.
/// </summary>
public sealed class PostgresContainerFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _container;
    private bool _catalogSeeded = false;

    public string ConnectionString => _container?.GetConnectionString() 
        ?? throw new InvalidOperationException("Container not started");

    public async Task InitializeAsync()
    {
        _container = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("starwars_test")
            .WithUsername("test")
            .WithPassword("test")
            .WithWaitStrategy(Wait.ForUnixContainer()
                .UntilPortIsAvailable(5432))
            .Build();

        await _container.StartAsync();
    }

    /// <summary>
    /// Seeds catalog data once per test collection.
    /// Subsequent calls are no-ops.
    /// </summary>
    public async Task EnsureCatalogSeededAsync(IServiceProvider services)
    {
        if (_catalogSeeded)
            return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Check if already seeded
        var hasData = await db.Films.AnyAsync() || await db.People.AnyAsync();
        if (hasData)
        {
            _catalogSeeded = true;
            return;
        }

        // Seed catalog
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.BootstrapAsync(CancellationToken.None);
        _catalogSeeded = true;
    }

    public async Task DisposeAsync()
    {
        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }
}
