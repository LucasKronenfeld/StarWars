using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanetsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PlanetsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/planets
    [HttpGet]
    public async Task<ActionResult<List<PlanetListItemDto>>> GetAll(CancellationToken ct)
    {
        var planets = await _db.Planets
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new PlanetListItemDto
            {
                Id = p.Id,
                Name = p.Name,
                Climate = p.Climate,
                Terrain = p.Terrain,
                Population = p.Population
            })
            .ToListAsync(ct);

        return Ok(planets);
    }

    // GET /api/planets/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlanetDetailsDto>> GetById(int id, CancellationToken ct)
    {
        var planet = await _db.Planets
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Include(p => p.FilmPlanets).ThenInclude(fp => fp.Film)
            .Include(p => p.HomeworldPeople)
            .AsSplitQuery()
            .FirstOrDefaultAsync(ct);

        if (planet is null) return NotFound();

        var dto = new PlanetDetailsDto
        {
            Id = planet.Id,
            Name = planet.Name,
            RotationPeriod = planet.RotationPeriod,
            OrbitalPeriod = planet.OrbitalPeriod,
            Diameter = planet.Diameter,
            Climate = planet.Climate,
            Gravity = planet.Gravity,
            Terrain = planet.Terrain,
            SurfaceWater = planet.SurfaceWater,
            Population = planet.Population,

            Films = planet.FilmPlanets
                .Where(fp => fp.Film is not null)
                .Select(fp => new NamedItemDto { Id = fp.FilmId, Name = fp.Film!.Title })
                .OrderBy(f => f.Name)
                .ToList(),

            Residents = planet.HomeworldPeople
                .Select(p => new NamedItemDto { Id = p.Id, Name = p.Name })
                .OrderBy(r => r.Name)
                .ToList()
        };

        return Ok(dto);
    }
}
