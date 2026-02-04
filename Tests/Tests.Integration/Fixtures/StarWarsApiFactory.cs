using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using StarWarsApi.Server.Data;
using System.Text;

namespace Tests.Integration.Fixtures;

/// <summary>
/// Custom WebApplicationFactory that:
/// - Injects test PostgreSQL connection string
/// - Uses Database.Migrate() for schema creation (proper migrations)
/// - Configures JWT authentication for testing
/// - Enables startup seeding with snapshot data
/// - Supports database reset between tests
/// </summary>
public class StarWarsApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly bool _enableSeeding;
    private readonly bool _useSnapshot;

    private const string TestJwtKey = "TestSecretKey1234567890TestSecretKey1234567890";
    private const string TestJwtIssuer = "StarWarsApi.Test";
    private const string TestJwtAudience = "StarWarsApi.Test";

    /// <summary>
    /// Creates a new API factory with the specified connection string.
    /// </summary>
    /// <param name="connectionString">PostgreSQL connection string</param>
    /// <param name="enableSeeding">Whether to enable automatic seeding on startup</param>
    /// <param name="useSnapshot">Whether to use snapshot data instead of live SWAPI (for deterministic seeding tests)</param>
    public StarWarsApiFactory(string connectionString, bool enableSeeding = true, bool useSnapshot = false)
    {
        _connectionString = connectionString;
        _enableSeeding = enableSeeding;
        _useSnapshot = useSnapshot;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Configure app configuration FIRST (before services)
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var configDict = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _connectionString,
                ["Database:AutoMigrate"] = "false", // Disable migration in Program.cs - we use Migrate()
                ["Seed:AutoBootstrap"] = _enableSeeding.ToString().ToLower(),
                ["Seed:UseExtendedJson"] = "false",
                ["Jwt:Key"] = TestJwtKey,
                ["Jwt:Issuer"] = TestJwtIssuer,
                ["Jwt:Audience"] = TestJwtAudience
            };

            // Only configure snapshot if requested (for deterministic seeding tests)
            if (_useSnapshot)
            {
                // Calculate path to snapshot data relative to test assembly
                // Test assembly is in: Tests/Tests.Integration/bin/Debug/net8.0/
                // Need to go up 5 levels to solution root
                var testAssemblyPath = AppContext.BaseDirectory;
                var solutionRoot = Path.GetFullPath(Path.Combine(testAssemblyPath, "..", "..", "..", "..", ".."));
                var snapshotPath = Path.Combine(solutionRoot, "Server", "StarWarsApi.Server", "Data", "Seeding", "SwapiSnapshot");
                
                configDict["Seed:UseLocalSnapshot"] = "true";
                configDict["Seed:SnapshotPath"] = snapshotPath;
            }
            
            config.AddInMemoryCollection(configDict);
        });

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext registration
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<ApplicationDbContext>();

            // Register test DbContext with Postgres using test connection string
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(_connectionString);
            });

            // IMPORTANT: If useSnapshot is true, we need to override the ISwapiSource registration
            // because Program.cs registers services before ConfigureAppConfiguration is fully processed
            if (_useSnapshot)
            {
                services.RemoveAll<StarWarsApi.Server.Swapi.ISwapiSource>();
                services.RemoveAll<StarWarsApi.Server.Swapi.SwapiClient>();
                services.AddScoped<StarWarsApi.Server.Swapi.ISwapiSource, StarWarsApi.Server.Swapi.SnapshotSwapiSource>();
            }

            // Build service provider to create schema
            var sp = services.BuildServiceProvider();

            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Apply migrations if database doesn't exist yet
            // Don't delete - the fixture handles cleanup between test collections
            // Tests within a collection share the catalog data for efficiency
            db.Database.Migrate();
        });

        // Re-configure JWT Bearer authentication after services are configured
        // This ensures the test JWT settings are used for token validation
        builder.ConfigureServices(services =>
        {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = TestJwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = TestJwtAudience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2),
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };
            });
        });
    }

    /// <summary>
    /// Gets a new scope with the ApplicationDbContext.
    /// </summary>
    public IServiceScope CreateDbScope()
    {
        return Services.CreateScope();
    }

    /// <summary>
    /// Executes an action with the database context.
    /// </summary>
    public async Task ExecuteDbContextAsync(Func<ApplicationDbContext, Task> action)
    {
        using var scope = CreateDbScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await action(db);
    }

    /// <summary>
    /// Executes a function with the database context and returns the result.
    /// </summary>
    public async Task<T> ExecuteDbContextAsync<T>(Func<ApplicationDbContext, Task<T>> func)
    {
        using var scope = CreateDbScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await func(db);
    }
}
