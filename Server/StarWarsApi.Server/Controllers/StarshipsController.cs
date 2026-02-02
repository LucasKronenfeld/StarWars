using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;
using StarWarsApi.Server.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;


namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StarshipsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public StarshipsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/starships?search=&class=&manufacturer=&minCost=&maxCost=&sort=&dir=&page=&pageSize=
    [HttpGet]
    public async Task<ActionResult<PagedResponse<StarshipListItemDto>>> GetAll([FromQuery] StarshipQuery q, CancellationToken ct)
    {
        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize switch
        {
            < 1 => 20,
            > 200 => 200,
            _ => q.PageSize
        };

        var desc = string.Equals(q.Dir, "desc", StringComparison.OrdinalIgnoreCase);

        // Catalog browsing: IsCatalog && IsActive only (no versioning)
        IQueryable<Starship> query = _db.Starships
            .AsNoTracking()
            .Where(s => s.IsCatalog && s.IsActive);

        // ---- Filters ----
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(x =>
                (x.Name != null && EF.Functions.ILike(x.Name, $"%{s}%")) ||
                (x.Model != null && EF.Functions.ILike(x.Model, $"%{s}%")) ||
                (x.Manufacturer != null && EF.Functions.ILike(x.Manufacturer, $"%{s}%"))
            );
        }


        if (!string.IsNullOrWhiteSpace(q.Class))
        {
            var cls = q.Class.Trim();
            query = query.Where(x => x.StarshipClass != null && EF.Functions.ILike(x.StarshipClass, $"%{cls}%"));
        }

        if (!string.IsNullOrWhiteSpace(q.Manufacturer))
        {
            var m = q.Manufacturer.Trim();
            query = query.Where(x => x.Manufacturer != null && EF.Functions.ILike(x.Manufacturer, $"%{m}%"));
        }

        if (q.MinCost is not null) query = query.Where(x => x.CostInCredits != null && x.CostInCredits >= q.MinCost);
        if (q.MaxCost is not null) query = query.Where(x => x.CostInCredits != null && x.CostInCredits <= q.MaxCost);

        if (q.MinLength is not null) query = query.Where(x => x.Length != null && x.Length >= q.MinLength);
        if (q.MaxLength is not null) query = query.Where(x => x.Length != null && x.Length <= q.MaxLength);

        if (q.MinCrew is not null) query = query.Where(x => x.Crew != null && x.Crew >= q.MinCrew);
        if (q.MaxCrew is not null) query = query.Where(x => x.Crew != null && x.Crew <= q.MaxCrew);

        if (q.MinPassengers is not null) query = query.Where(x => x.Passengers != null && x.Passengers >= q.MinPassengers);
        if (q.MaxPassengers is not null) query = query.Where(x => x.Passengers != null && x.Passengers <= q.MaxPassengers);

        if (q.MinCargoCapacity is not null) query = query.Where(x => x.CargoCapacity != null && x.CargoCapacity >= q.MinCargoCapacity);
        if (q.MaxCargoCapacity is not null) query = query.Where(x => x.CargoCapacity != null && x.CargoCapacity <= q.MaxCargoCapacity);

        // ---- Sorting (safe allowlist) ----
        query = ApplySorting(query, q.Sort, desc);

        // Total after filters, before paging
        var totalCount = await query.CountAsync(ct);

        // Page + projection (no Includes needed for list endpoint)
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new StarshipListItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Model = x.Model,
                Manufacturer = x.Manufacturer,
                StarshipClass = x.StarshipClass,
                CostInCredits = x.CostInCredits,
                Length = x.Length,
                Crew = x.Crew,
                Passengers = x.Passengers,
                CargoCapacity = x.CargoCapacity
            })
            .ToListAsync(ct);

        return Ok(new PagedResponse<StarshipListItemDto>
        {
            Items = items,
            TotalCount = totalCount
        });
    }

    // GET /api/starships/9
    [HttpGet("{id:int}")]
    public async Task<ActionResult<StarshipDetailsDto>> GetById(int id, CancellationToken ct)
    {
        // Projection keeps it DTO-shaped and avoids circular refs automatically.
        // With join tables, we traverse FilmStarships/StarshipPilots.
        var dto = await _db.Starships
            .AsNoTracking()
            .Where(s => s.Id == id && s.IsCatalog && s.IsActive)
            .Select(s => new StarshipDetailsDto
            {
                Id = s.Id,
                Name = s.Name,
                Model = s.Model,
                Manufacturer = s.Manufacturer,
                StarshipClass = s.StarshipClass,
                CostInCredits = s.CostInCredits,
                Length = s.Length,
                Crew = s.Crew,
                Passengers = s.Passengers,
                CargoCapacity = s.CargoCapacity,
                HyperdriveRating = s.HyperdriveRating,
                MGLT = s.MGLT,
                MaxAtmospheringSpeed = s.MaxAtmospheringSpeed,
                Consumables = s.Consumables,

                Films = s.FilmStarships
                    .Select(fs => new NamedItemDto
                    {
                        Id = fs.FilmId,
                        Name = fs.Film.Title
                    })
                    .OrderBy(x => x.Name)
                    .ToList(),

                Pilots = s.StarshipPilots
                    .Select(sp => new NamedItemDto
                    {
                        Id = sp.PersonId,
                        Name = sp.Person.Name
                    })
                    .OrderBy(x => x.Name)
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (dto is null) return NotFound();
        return Ok(dto);
    }

    private static IQueryable<Starship> ApplySorting(IQueryable<Starship> query, string? sort, bool desc)
    {
        var key = (sort ?? "name").Trim().ToLowerInvariant();

        // stable tie-breaker by Id => consistent pagination
        return (key, desc) switch
        {
            ("name", false) => query.OrderBy(x => x.Name).ThenBy(x => x.Id),
            ("name", true)  => query.OrderByDescending(x => x.Name).ThenBy(x => x.Id),

            ("model", false) => query.OrderBy(x => x.Model).ThenBy(x => x.Id),
            ("model", true)  => query.OrderByDescending(x => x.Model).ThenBy(x => x.Id),

            ("manufacturer", false) => query.OrderBy(x => x.Manufacturer).ThenBy(x => x.Id),
            ("manufacturer", true)  => query.OrderByDescending(x => x.Manufacturer).ThenBy(x => x.Id),

            ("class", false) => query.OrderBy(x => x.StarshipClass).ThenBy(x => x.Id),
            ("class", true)  => query.OrderByDescending(x => x.StarshipClass).ThenBy(x => x.Id),

            ("cost", false) => query.OrderBy(x => x.CostInCredits).ThenBy(x => x.Id),
            ("cost", true)  => query.OrderByDescending(x => x.CostInCredits).ThenBy(x => x.Id),

            ("length", false) => query.OrderBy(x => x.Length).ThenBy(x => x.Id),
            ("length", true)  => query.OrderByDescending(x => x.Length).ThenBy(x => x.Id),

            ("crew", false) => query.OrderBy(x => x.Crew).ThenBy(x => x.Id),
            ("crew", true)  => query.OrderByDescending(x => x.Crew).ThenBy(x => x.Id),

            ("passengers", false) => query.OrderBy(x => x.Passengers).ThenBy(x => x.Id),
            ("passengers", true)  => query.OrderByDescending(x => x.Passengers).ThenBy(x => x.Id),

            ("cargo", false) => query.OrderBy(x => x.CargoCapacity).ThenBy(x => x.Id),
            ("cargo", true)  => query.OrderByDescending(x => x.CargoCapacity).ThenBy(x => x.Id),

            _ => desc
                ? query.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : query.OrderBy(x => x.Name).ThenBy(x => x.Id),
        };
    }

        [HttpGet("filters")]
public async Task<ActionResult<StarshipFiltersDto>> GetFilters(CancellationToken ct)
{
    // Dropdowns - IsCatalog && IsActive only (no versioning)
    var manufacturers = await _db.Starships
        .AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.Manufacturer != null && s.Manufacturer != "")
        .Select(s => s.Manufacturer!)
        .Distinct()
        .OrderBy(x => x)
        .ToListAsync(ct);

    var classes = await _db.Starships
        .AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.StarshipClass != null && s.StarshipClass != "")
        .Select(s => s.StarshipClass!)
        .Distinct()
        .OrderBy(x => x)
        .ToListAsync(ct);

    // Ranges (compute each from non-null rows to avoid null-only aggregates)
    var costRange = await _db.Starships.AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.CostInCredits != null)
        .GroupBy(_ => 1)
        .Select(g => new RangeDto<decimal>
        {
            Min = g.Min(x => x.CostInCredits),
            Max = g.Max(x => x.CostInCredits)
        })
        .FirstOrDefaultAsync(ct) ?? new RangeDto<decimal>();

    var lengthRange = await _db.Starships.AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.Length != null)
        .GroupBy(_ => 1)
        .Select(g => new RangeDto<double>
        {
            Min = g.Min(x => x.Length),
            Max = g.Max(x => x.Length)
        })
        .FirstOrDefaultAsync(ct) ?? new RangeDto<double>();

    var crewRange = await _db.Starships.AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.Crew != null)
        .GroupBy(_ => 1)
        .Select(g => new RangeDto<int>
        {
            Min = g.Min(x => x.Crew),
            Max = g.Max(x => x.Crew)
        })
        .FirstOrDefaultAsync(ct) ?? new RangeDto<int>();

    var passengersRange = await _db.Starships.AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.Passengers != null)
        .GroupBy(_ => 1)
        .Select(g => new RangeDto<int>
        {
            Min = g.Min(x => x.Passengers),
            Max = g.Max(x => x.Passengers)
        })
        .FirstOrDefaultAsync(ct) ?? new RangeDto<int>();

    var cargoRange = await _db.Starships.AsNoTracking()
        .Where(s => s.IsCatalog && s.IsActive)
        .Where(s => s.CargoCapacity != null)
        .GroupBy(_ => 1)
        .Select(g => new RangeDto<long>
        {
            Min = g.Min(x => x.CargoCapacity),
            Max = g.Max(x => x.CargoCapacity)
        })
        .FirstOrDefaultAsync(ct) ?? new RangeDto<long>();

    return Ok(new StarshipFiltersDto
    {
        Manufacturers = manufacturers,
        Classes = classes,
        CostInCredits = costRange,
        Length = lengthRange,
        Crew = crewRange,
        Passengers = passengersRange,
        CargoCapacity = cargoRange
    });
}

// POST /api/starships/{id}/fork
[Authorize]
[HttpPost("{id:int}/fork")]
public async Task<ActionResult<ForkStarshipResponse>> ForkCatalogStarship(
    int id,
    [FromBody] ForkStarshipRequest req,
    CancellationToken ct)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null) return Unauthorized();

    // Must fork ONLY from active catalog ships (no versioning check)
    var baseShip = await _db.Starships
        .AsNoTracking()
        .FirstOrDefaultAsync(s => s.Id == id && s.IsCatalog && s.IsActive, ct);

    if (baseShip is null) return NotFound("Catalog starship not found.");

    // Optional: prevent duplicate forks for the same base ship per user.
    // If you prefer allowing multiple forks, delete this block.
    var existingForkId = await _db.Starships
        .AsNoTracking()
        .Where(s => !s.IsCatalog && s.IsActive && s.OwnerUserId == userId && s.BaseStarshipId == id)
        .Select(s => (int?)s.Id)
        .FirstOrDefaultAsync(ct);

    if (existingForkId is not null)
    {
        // Optionally add existing fork to fleet
        if (req.AddToFleet)
            await AddStarshipToFleet(userId, existingForkId.Value, quantity: 1, ct);

        return Ok(new ForkStarshipResponse
        {
            Id = existingForkId.Value,
            BaseStarshipId = id
        });
    }

    // Create user-owned copy
    var fork = new Starship
    {
        IsCatalog = false,
        IsActive = true,
        SwapiUrl = null,

        OwnerUserId = userId,
        BaseStarshipId = baseShip.Id,

        // Copy fields
        Name = string.IsNullOrWhiteSpace(req.Name) ? baseShip.Name : req.Name.Trim(),
        Model = baseShip.Model,
        Manufacturer = baseShip.Manufacturer,
        StarshipClass = baseShip.StarshipClass,

        CostInCredits = baseShip.CostInCredits,
        Length = baseShip.Length,
        Crew = baseShip.Crew,
        Passengers = baseShip.Passengers,
        CargoCapacity = baseShip.CargoCapacity,

        HyperdriveRating = baseShip.HyperdriveRating,
        MGLT = baseShip.MGLT,

        MaxAtmospheringSpeed = baseShip.MaxAtmospheringSpeed,
        Consumables = baseShip.Consumables
    };

    _db.Starships.Add(fork);
    await _db.SaveChangesAsync(ct);

    if (req.AddToFleet)
        await AddStarshipToFleet(userId, fork.Id, quantity: 1, ct);

    return Ok(new ForkStarshipResponse
    {
        Id = fork.Id,
        BaseStarshipId = baseShip.Id
    });
}

private async Task AddStarshipToFleet(string userId, int starshipId, int quantity, CancellationToken ct)
{
    var fleet = await _db.Fleets.FirstOrDefaultAsync(f => f.UserId == userId, ct);
    if (fleet is null)
    {
        fleet = new Models.Fleet { UserId = userId };
        _db.Fleets.Add(fleet);
        await _db.SaveChangesAsync(ct);
    }

    var item = await _db.FleetStarships
        .FirstOrDefaultAsync(x => x.FleetId == fleet.Id && x.StarshipId == starshipId, ct);

    if (item is null)
    {
        _db.FleetStarships.Add(new Models.FleetStarship
        {
            FleetId = fleet.Id,
            StarshipId = starshipId,
            Quantity = quantity < 1 ? 1 : quantity
        });
    }
    else
    {
        item.Quantity += quantity < 1 ? 1 : quantity;
    }

    await _db.SaveChangesAsync(ct);
}

}