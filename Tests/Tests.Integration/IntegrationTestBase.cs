using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StarWarsApi.Server.Data;
using Tests.Integration.Fixtures;
using Tests.Integration.Helpers;

namespace Tests.Integration;

/// <summary>
/// Base class for integration tests.
/// Provides common setup, database access, and authentication helpers.
/// Tests share the same database container and catalog data.
/// User data is cleared before each test for isolation.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly PostgresContainerFixture DbFixture;
    protected StarWarsApiFactory Factory = null!;
    protected HttpClient Client = null!;
    protected AuthClientHelper AuthHelper = null!;

    protected IntegrationTestBase(PostgresContainerFixture dbFixture)
    {
        DbFixture = dbFixture;
    }

    public virtual async Task InitializeAsync()
    {
        // Create a factory - this shares the testcontainer database
        Factory = new StarWarsApiFactory(
            DbFixture.ConnectionString, 
            enableSeeding: false); // Never auto-seed - we control seeding explicitly

        Client = Factory.CreateClient();
        AuthHelper = new AuthClientHelper(Client, Factory);

        // Ensure catalog is seeded once per test collection
        if (ShouldSeedDatabase())
        {
            await DbFixture.EnsureCatalogSeededAsync(Factory.Services);
        }

        // Clear user data before each test (preserves catalog)
        await ResetUserDataAsync();

        // Perform any additional setup
        await SetupAsync();
    }

    public virtual async Task DisposeAsync()
    {
        Client?.Dispose();
        await Factory.DisposeAsync();
    }

    /// <summary>
    /// Override to enable/disable catalog seeding for specific test classes.
    /// Default is true (use shared catalog from test collection).
    /// Set to false only for tests that don't need catalog data.
    /// </summary>
    protected virtual bool ShouldSeedDatabase() => true;

    /// <summary>
    /// Override to perform additional setup after factory creation.
    /// </summary>
    protected virtual Task SetupAsync() => Task.CompletedTask;

    /// <summary>
    /// Resets user data while preserving catalog.
    /// </summary>
    protected Task ResetUserDataAsync()
    {
        return DbResetHelper.ResetUserDataAsync(Factory.Services);
    }

    /// <summary>
    /// Clears all data including catalog for seeding tests.
    /// </summary>
    protected Task ClearAllDataAsync()
    {
        return DbResetHelper.ClearAllDataAsync(Factory.Services);
    }

    /// <summary>
    /// Executes an action with the database context.
    /// </summary>
    protected Task ExecuteDbContextAsync(Func<ApplicationDbContext, Task> action)
    {
        return Factory.ExecuteDbContextAsync(action);
    }

    /// <summary>
    /// Executes a function with the database context and returns the result.
    /// </summary>
    protected Task<T> ExecuteDbContextAsync<T>(Func<ApplicationDbContext, Task<T>> func)
    {
        return Factory.ExecuteDbContextAsync(func);
    }

    /// <summary>
    /// Creates a unique email for test user isolation.
    /// </summary>
    protected string CreateUniqueEmail(string prefix = "user")
    {
        return $"{prefix}_{Guid.NewGuid():N}@test.com";
    }

    /// <summary>
    /// Registers a test user and returns authenticated client.
    /// </summary>
    protected Task<HttpClient> RegisterUserAsync(string? email = null, string password = "Password123!")
    {
        email ??= CreateUniqueEmail();
        return AuthHelper.RegisterAndGetAuthenticatedClientAsync(email, password);
    }

    /// <summary>
    /// Gets a service from the test server's DI container.
    /// </summary>
    protected T GetService<T>() where T : notnull
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<T>();
    }
}
