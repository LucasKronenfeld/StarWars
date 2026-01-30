using Microsoft.AspNetCore.Mvc;
using StarWarsApi.Server.Data.Seeding;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    [HttpPost("seed")]
    public async Task<IActionResult> Seed(
        [FromServices] DatabaseSeeder seeder,
        [FromQuery] bool force = false,
        CancellationToken ct = default)
    {
        // Dev-only guard
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (!string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
            return Forbid("Seeding only allowed in Development.");

        // Simple API key guard
        var configKey = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()["Seed:ApiKey"];

        var provided = Request.Headers["X-SEED-KEY"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(configKey) || provided != configKey)
            return Unauthorized("Missing or invalid X-SEED-KEY.");

        var result = await seeder.SeedAsync(force, ct);
        return Ok(result);
    }
}
