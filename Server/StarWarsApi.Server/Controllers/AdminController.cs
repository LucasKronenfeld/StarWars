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

    public AdminController(ILogger<AdminController> logger)
    {
        _logger = logger;
    }

    private string GetAdminIdentity()
        => User.FindFirstValue(ClaimTypes.Email)
           ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? "unknown";

    [HttpPost("seed")]
    public async Task<IActionResult> Seed(
        [FromServices] DatabaseSeeder seeder,
        [FromQuery] bool force = false,
        [FromQuery] bool catalogOnly = false,
        CancellationToken ct = default)
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var admin = GetAdminIdentity();

        if (catalogOnly && force)
            return BadRequest("force is not applicable when catalogOnly=true.");

        // Full wipe: dev-only
        if (!catalogOnly && !string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
            return Forbid("Full reseed only allowed in Development. Use ?catalogOnly=true for catalog sync.");

        // Catalog sync: prod requires explicit enable
        var allowProdSync = config["Seed:AllowCatalogSyncInProduction"];
        if (catalogOnly
            && !string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(allowProdSync, "true", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Catalog sync disabled outside Development. Set Seed:AllowCatalogSyncInProduction=true to enable.");
        }

        // API key guard (both modes)
        var configKey = config["Seed:ApiKey"];
        var provided = Request.Headers["X-SEED-KEY"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(configKey) || provided != configKey)
            return Unauthorized("Missing or invalid X-SEED-KEY.");

        // Log admin action
        if (catalogOnly)
        {
            _logger.LogInformation("Admin '{Admin}' initiated catalog-only sync.", admin);
            var result = await seeder.SyncCatalogAsync(ct);
            _logger.LogInformation("Admin '{Admin}' completed catalog sync: {@Result}", admin, result);
            return Ok(result);
        }
        else
        {
            _logger.LogInformation("Admin '{Admin}' initiated full reseed (force={Force}).", admin, force);
            var result = await seeder.SeedAsync(force, ct);
            _logger.LogInformation("Admin '{Admin}' completed full reseed: {@Result}", admin, result);
            return Ok(result);
        }
    }
}
