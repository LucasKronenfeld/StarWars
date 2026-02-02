using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;
using StarWarsApi.Server.Models;
using System.Security.Claims;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/admin/catalog")]
[Authorize(Roles = "Admin")]
public class AdminCatalogController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AdminCatalogController> _logger;

    public AdminCatalogController(ApplicationDbContext db, ILogger<AdminCatalogController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string GetAdminIdentity()
        => User.FindFirstValue(ClaimTypes.Email) 
           ?? User.FindFirstValue(ClaimTypes.NameIdentifier) 
           ?? "unknown";

    // GET /api/admin/catalog/starships?includeInactive=true&search=&sort=&dir=&page=&pageSize=
    [HttpGet("starships")]
    public async Task<ActionResult<PagedResponse<AdminCatalogStarshipDto>>> GetCatalogStarships(
        [FromQuery] bool includeInactive = false,
        [FromQuery] string? search = null,
        [FromQuery] string? sort = "name",
        [FromQuery] string? dir = "asc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize switch { < 1 => 25, > 200 => 200, _ => pageSize };
        var desc = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);

        IQueryable<Starship> query = _db.Starships
            .AsNoTracking()
            .Where(s => s.IsCatalog);

        // Filter inactive unless requested
        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        // Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(s =>
                (s.Name != null && EF.Functions.ILike(s.Name, $"%{term}%")) ||
                (s.Manufacturer != null && EF.Functions.ILike(s.Manufacturer, $"%{term}%"))
            );
        }

        // Sorting
        query = ApplySorting(query, sort, desc);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminCatalogStarshipDto
            {
                Id = s.Id,
                Name = s.Name,
                Manufacturer = s.Manufacturer,
                StarshipClass = s.StarshipClass,
                IsActive = s.IsActive,
                SwapiUrl = s.SwapiUrl
            })
            .ToListAsync(ct);

        return Ok(new PagedResponse<AdminCatalogStarshipDto>
        {
            Items = items,
            TotalCount = totalCount
        });
    }

    // PATCH /api/admin/catalog/starships/{id}/retire
    [HttpPatch("starships/{id:int}/retire")]
    public async Task<ActionResult> RetireStarship(int id, CancellationToken ct)
    {
        var ship = await _db.Starships
            .FirstOrDefaultAsync(s => s.Id == id && s.IsCatalog, ct);

        if (ship is null)
            return NotFound("Catalog starship not found.");

        var admin = GetAdminIdentity();

        // Idempotent: already retired is success
        if (!ship.IsActive)
        {
            _logger.LogInformation(
                "Admin '{Admin}' attempted to retire catalog starship {Id} '{Name}' but it was already retired.",
                admin, id, ship.Name);
            return NoContent();
        }

        ship.IsActive = false;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin '{Admin}' retired catalog starship {Id} '{Name}'.",
            admin, id, ship.Name);

        return NoContent();
    }

    // PATCH /api/admin/catalog/starships/{id}/activate
    [HttpPatch("starships/{id:int}/activate")]
    public async Task<ActionResult> ActivateStarship(int id, CancellationToken ct)
    {
        var ship = await _db.Starships
            .FirstOrDefaultAsync(s => s.Id == id && s.IsCatalog, ct);

        if (ship is null)
            return NotFound("Catalog starship not found.");

        var admin = GetAdminIdentity();

        // Idempotent: already active is success
        if (ship.IsActive)
        {
            _logger.LogInformation(
                "Admin '{Admin}' attempted to activate catalog starship {Id} '{Name}' but it was already active.",
                admin, id, ship.Name);
            return NoContent();
        }

        ship.IsActive = true;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin '{Admin}' activated catalog starship {Id} '{Name}'.",
            admin, id, ship.Name);

        return NoContent();
    }

    private static IQueryable<Starship> ApplySorting(IQueryable<Starship> query, string? sort, bool desc)
    {
        var key = (sort ?? "name").Trim().ToLowerInvariant();

        return (key, desc) switch
        {
            ("name", false) => query.OrderBy(x => x.Name).ThenBy(x => x.Id),
            ("name", true) => query.OrderByDescending(x => x.Name).ThenBy(x => x.Id),

            ("manufacturer", false) => query.OrderBy(x => x.Manufacturer).ThenBy(x => x.Id),
            ("manufacturer", true) => query.OrderByDescending(x => x.Manufacturer).ThenBy(x => x.Id),

            ("class", false) => query.OrderBy(x => x.StarshipClass).ThenBy(x => x.Id),
            ("class", true) => query.OrderByDescending(x => x.StarshipClass).ThenBy(x => x.Id),

            ("isactive", false) => query.OrderBy(x => x.IsActive).ThenBy(x => x.Id),
            ("isactive", true) => query.OrderByDescending(x => x.IsActive).ThenBy(x => x.Id),

            _ => desc
                ? query.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : query.OrderBy(x => x.Name).ThenBy(x => x.Id)
        };
    }
}

// DTO for admin catalog listing
public sealed class AdminCatalogStarshipDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }
    public bool IsActive { get; set; }
    public string? SwapiUrl { get; set; }
}
