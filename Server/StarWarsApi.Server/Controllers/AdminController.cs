using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using StarWarsApi.Server.Data.Seeding;
using System.Security.Claims;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ILogger<AdminController> _logger;
    private readonly IWebHostEnvironment _env;

    public AdminController(ILogger<AdminController> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    private string GetAdminIdentity()
        => User.FindFirstValue(ClaimTypes.Email)
           ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? "unknown";

    /// <summary>
    /// Production-safe catalog sync: upserts SWAPI + extended JSON without wiping user data.
    /// Requires Admin JWT role.
    /// </summary>
    [HttpPost("sync-catalog")]
    public async Task<IActionResult> SyncCatalog(
        [FromServices] DatabaseSeeder seeder,
        CancellationToken ct = default)
    {
        var admin = GetAdminIdentity();
        _logger.LogInformation("Admin '{Admin}' initiated production-safe catalog sync", admin);

        try
        {
            var result = await seeder.SyncCatalogAsync(ct);
            _logger.LogInformation("Admin '{Admin}' completed catalog sync: {@Result}", admin, result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin '{Admin}' catalog sync failed", admin);
            return StatusCode(500, new { error = "Catalog sync failed", message = ex.Message });
        }
    }

    /// <summary>
    /// Development-only: wipe all data and reseed from SWAPI + JSON.
    /// Requires Development environment.
    /// Optional API key for additional security.
    /// </summary>
    [HttpPost("dev-wipe-reseed")]
    public async Task<IActionResult> DevWipeReseed(
        [FromServices] DatabaseSeeder seeder,
        [FromServices] IConfiguration config,
        CancellationToken ct = default)
    {
        var admin = GetAdminIdentity();

        // Only allowed in Development
        if (!_env.IsDevelopment())
        {
            _logger.LogWarning("Admin '{Admin}' attempted dev wipe in non-Development environment", admin);
            return Forbid("Dev wipe only allowed in Development environment");
        }

        // Optional API key check (if configured)
        var configKey = config["Seed:ApiKey"];
        if (!string.IsNullOrWhiteSpace(configKey))
        {
            var provided = Request.Headers["X-SEED-KEY"].FirstOrDefault();
            if (provided != configKey)
            {
                _logger.LogWarning("Admin '{Admin}' provided invalid seed key for dev wipe", admin);
                return Unauthorized("Invalid or missing X-SEED-KEY header");
            }
        }

        _logger.LogWarning("Admin '{Admin}' initiated FULL DATABASE WIPE AND RESEED", admin);

        try
        {
            var result = await seeder.SeedAsync(force: true, ct);
            _logger.LogInformation("Admin '{Admin}' completed dev wipe and reseed: {@Result}", admin, result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin '{Admin}' dev wipe and reseed failed", admin);
            return StatusCode(500, new { error = "Dev wipe and reseed failed", message = ex.Message });
        }
    }

    /// <summary>
    /// Get environment info for frontend (shows whether dev-only features are available).
    /// </summary>
    [HttpGet("environment")]
    public IActionResult GetEnvironment()
    {
        return Ok(new
        {
            environment = _env.EnvironmentName,
            isDevelopment = _env.IsDevelopment()
        });
    }
}
