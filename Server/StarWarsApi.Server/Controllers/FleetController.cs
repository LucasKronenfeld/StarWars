using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;
using StarWarsApi.Server.Models;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FleetController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    
    private sealed record FleetRow(
    int StarshipId,
    int Quantity,
    string? Nickname,
    DateTime AddedAt,
    Starship Starship
    );
    public FleetController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/fleet
    [HttpGet]
    public async Task<ActionResult<FleetDto>> GetMyFleet(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var fleet = await _db.Fleets
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Select(f => new FleetDto
            {
                FleetId = f.Id,
                Items = f.FleetStarships
                    .OrderByDescending(x => x.AddedAt)
                    .Select(x => new FleetItemDto
                    {
                        StarshipId = x.StarshipId,
                        Name = x.Starship.Name,
                        Manufacturer = x.Starship.Manufacturer,
                        StarshipClass = x.Starship.StarshipClass,
                        Quantity = x.Quantity,
                        Nickname = x.Nickname,
                        // UI badge fields (fleet includes retired ships)
                        IsCatalog = x.Starship.IsCatalog,
                        IsActive = x.Starship.IsActive
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        // If no fleet yet, return empty
        if (fleet is null)
        {
            return Ok(new FleetDto { FleetId = 0, Items = new() });
        }

        return Ok(fleet);
    }

    // POST /api/fleet/items
    [HttpPost("items")]
    public async Task<ActionResult> AddItem([FromBody] AddFleetItemRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var qty = req.Quantity < 1 ? 1 : req.Quantity;

        // Validate starship exists and is allowed to be added
        var starship = await _db.Starships
            .AsNoTracking()
            .Where(s => s.Id == req.StarshipId)
            .Select(s => new { s.IsCatalog, s.IsActive, s.OwnerUserId })
            .FirstOrDefaultAsync(ct);

        if (starship is null)
            return NotFound($"Starship {req.StarshipId} not found.");

        // Block adding any inactive ship
        if (!starship.IsActive)
            return BadRequest(starship.IsCatalog
                ? "Cannot add a retired catalog ship to fleet."
                : "Cannot add an inactive custom ship to fleet.");

        // Security: custom ships can only be added by their owner
        if (!starship.IsCatalog && starship.OwnerUserId != userId)
            return Forbid();

        // Ensure fleet exists
        var fleet = await _db.Fleets.FirstOrDefaultAsync(f => f.UserId == userId, ct);
        if (fleet is null)
        {
            fleet = new Fleet { UserId = userId };
            _db.Fleets.Add(fleet);
            await _db.SaveChangesAsync(ct);
        }

        // Add or increment existing row
        var item = await _db.FleetStarships
            .FirstOrDefaultAsync(x => x.FleetId == fleet.Id && x.StarshipId == req.StarshipId, ct);

        if (item is null)
        {
            _db.FleetStarships.Add(new FleetStarship
            {
                FleetId = fleet.Id,
                StarshipId = req.StarshipId,
                Quantity = qty
            });
        }
        else
        {
            item.Quantity += qty;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // PATCH /api/fleet/items/{starshipId}
    [HttpPatch("items/{starshipId:int}")]
    public async Task<ActionResult> UpdateItem(int starshipId, [FromBody] UpdateFleetItemRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var fleetId = await _db.Fleets
            .Where(f => f.UserId == userId)
            .Select(f => (int?)f.Id)
            .FirstOrDefaultAsync(ct);

        if (fleetId is null) return NotFound("Fleet not found.");

        var item = await _db.FleetStarships
            .FirstOrDefaultAsync(x => x.FleetId == fleetId && x.StarshipId == starshipId, ct);

        if (item is null) return NotFound("Fleet item not found.");

        item.Quantity = req.Quantity < 1 ? 1 : req.Quantity;
        item.Nickname = string.IsNullOrWhiteSpace(req.Nickname) ? null : req.Nickname.Trim();

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // DELETE /api/fleet/items/{starshipId}
    [HttpDelete("items/{starshipId:int}")]
    public async Task<ActionResult> RemoveItem(int starshipId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var fleetId = await _db.Fleets
            .Where(f => f.UserId == userId)
            .Select(f => (int?)f.Id)
            .FirstOrDefaultAsync(ct);

        if (fleetId is null) return NotFound("Fleet not found.");

        var item = await _db.FleetStarships
            .FirstOrDefaultAsync(x => x.FleetId == fleetId && x.StarshipId == starshipId, ct);

        if (item is null) return NotFound("Fleet item not found.");

        _db.FleetStarships.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // GET /api/fleet/items?search=&class=&manufacturer=&minCost=&maxCost=&sort=&dir=&page=&pageSize=
[HttpGet("items")]
public async Task<ActionResult<PagedResponse<FleetListItemDto>>> GetFleetItems([FromQuery] FleetQuery q, CancellationToken ct)
{
    var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
    if (userId is null) return Unauthorized();

    var page = q.Page < 1 ? 1 : q.Page;
    var pageSize = q.PageSize switch
    {
        < 1 => 20,
        > 200 => 200,
        _ => q.PageSize
    };
    var desc = string.Equals(q.Dir, "desc", StringComparison.OrdinalIgnoreCase);

    // Find fleetId (if no fleet yet -> empty)
    var fleetId = await _db.Fleets
        .Where(f => f.UserId == userId)
        .Select(f => (int?)f.Id)
        .FirstOrDefaultAsync(ct);

    if (fleetId is null)
{
    return Ok(new PagedResponse<FleetListItemDto>
    {
        Items = Array.Empty<FleetListItemDto>(),
        TotalCount = 0
    });
}


    // Base query: user's fleet items + starship fields
    IQueryable<FleetRow> query = _db.FleetStarships
    .AsNoTracking()
    .Where(x => x.FleetId == fleetId.Value)
    .Select(x => new FleetRow(
        x.StarshipId,
        x.Quantity,
        x.Nickname,
        x.AddedAt,
        x.Starship
    ));


    // ---- Filters ----
    if (!string.IsNullOrWhiteSpace(q.Search))
    {
        var s = q.Search.Trim();
        query = query.Where(x =>
            EF.Functions.ILike(x.Starship.Name, $"%{s}%") ||
            (x.Starship.Model != null && EF.Functions.ILike(x.Starship.Model, $"%{s}%")) ||
            (x.Starship.Manufacturer != null && EF.Functions.ILike(x.Starship.Manufacturer, $"%{s}%")) ||
            (x.Nickname != null && EF.Functions.ILike(x.Nickname, $"%{s}%"))
        );
    }

    if (!string.IsNullOrWhiteSpace(q.Class))
    {
        var cls = q.Class.Trim();
        query = query.Where(x => x.Starship.StarshipClass != null &&
                                 EF.Functions.ILike(x.Starship.StarshipClass, $"%{cls}%"));
    }

    if (!string.IsNullOrWhiteSpace(q.Manufacturer))
    {
        var m = q.Manufacturer.Trim();
        query = query.Where(x => x.Starship.Manufacturer != null &&
                                 EF.Functions.ILike(x.Starship.Manufacturer, $"%{m}%"));
    }

    if (q.MinCost is not null) query = query.Where(x => x.Starship.CostInCredits != null && x.Starship.CostInCredits >= q.MinCost);
    if (q.MaxCost is not null) query = query.Where(x => x.Starship.CostInCredits != null && x.Starship.CostInCredits <= q.MaxCost);

    if (q.MinLength is not null) query = query.Where(x => x.Starship.Length != null && x.Starship.Length >= q.MinLength);
    if (q.MaxLength is not null) query = query.Where(x => x.Starship.Length != null && x.Starship.Length <= q.MaxLength);

    if (q.MinCrew is not null) query = query.Where(x => x.Starship.Crew != null && x.Starship.Crew >= q.MinCrew);
    if (q.MaxCrew is not null) query = query.Where(x => x.Starship.Crew != null && x.Starship.Crew <= q.MaxCrew);

    // ---- Sorting ----
    query = ApplyFleetSorting(query, q.Sort, desc);

    var totalCount = await query.CountAsync(ct);

    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(x => new FleetListItemDto
        {
            StarshipId = x.StarshipId,
            Name = x.Starship.Name,
            Manufacturer = x.Starship.Manufacturer,
            StarshipClass = x.Starship.StarshipClass,
            CostInCredits = x.Starship.CostInCredits,
            Length = x.Starship.Length,
            Crew = x.Starship.Crew,

            Quantity = x.Quantity,
            Nickname = x.Nickname,
            AddedAt = x.AddedAt,

            // UI badge fields (fleet includes retired ships)
            IsCatalog = x.Starship.IsCatalog,
            IsActive = x.Starship.IsActive
        })
        .ToListAsync(ct);

    return Ok(new PagedResponse<FleetListItemDto>
    {
        Items = items,
        TotalCount = totalCount
    });
}

private static IQueryable<FleetRow> ApplyFleetSorting( IQueryable<FleetRow> query, string? sort, bool desc)
{
    var key = (sort ?? "addedAt").Trim().ToLowerInvariant();

    return (key, desc) switch
    {
        ("name", false) => query.OrderBy(x => x.Starship.Name).ThenBy(x => x.StarshipId),
        ("name", true)  => query.OrderByDescending(x => x.Starship.Name).ThenBy(x => x.StarshipId),

        ("manufacturer", false) => query.OrderBy(x => x.Starship.Manufacturer).ThenBy(x => x.StarshipId),
        ("manufacturer", true)  => query.OrderByDescending(x => x.Starship.Manufacturer).ThenBy(x => x.StarshipId),

        ("class", false) => query.OrderBy(x => x.Starship.StarshipClass).ThenBy(x => x.StarshipId),
        ("class", true)  => query.OrderByDescending(x => x.Starship.StarshipClass).ThenBy(x => x.StarshipId),

        ("cost", false) => query.OrderBy(x => x.Starship.CostInCredits).ThenBy(x => x.StarshipId),
        ("cost", true)  => query.OrderByDescending(x => x.Starship.CostInCredits).ThenBy(x => x.StarshipId),

        ("length", false) => query.OrderBy(x => x.Starship.Length).ThenBy(x => x.StarshipId),
        ("length", true)  => query.OrderByDescending(x => x.Starship.Length).ThenBy(x => x.StarshipId),

        ("crew", false) => query.OrderBy(x => x.Starship.Crew).ThenBy(x => x.StarshipId),
        ("crew", true)  => query.OrderByDescending(x => x.Starship.Crew).ThenBy(x => x.StarshipId),

        ("quantity", false) => query.OrderBy(x => x.Quantity).ThenBy(x => x.StarshipId),
        ("quantity", true)  => query.OrderByDescending(x => x.Quantity).ThenBy(x => x.StarshipId),

        ("addedat", false) => query.OrderBy(x => x.AddedAt).ThenBy(x => x.StarshipId),
        ("addedat", true)  => query.OrderByDescending(x => x.AddedAt).ThenBy(x => x.StarshipId),

        _ => desc
            ? query.OrderByDescending(x => x.AddedAt).ThenBy(x => x.StarshipId)
            : query.OrderBy(x => x.AddedAt).ThenBy(x => x.StarshipId)
    };
}
}