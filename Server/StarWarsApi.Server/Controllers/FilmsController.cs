using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilmsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public FilmsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/films/1
    [HttpGet("{id:int}")]
public async Task<ActionResult<FilmDetailsDto>> GetById(int id, CancellationToken ct)
{
    var film = await _db.Films
        .AsNoTracking()
        .Where(f => f.Id == id)

        // Bring in join rows + their related entity in one go
        .Include(f => f.FilmCharacters).ThenInclude(fc => fc.Person)
        .Include(f => f.FilmPlanets).ThenInclude(fp => fp.Planet)
        .Include(f => f.FilmStarships).ThenInclude(fs => fs.Starship)
        .Include(f => f.FilmVehicles).ThenInclude(fv => fv.Vehicle)
        .Include(f => f.FilmSpecies).ThenInclude(fs => fs.Species)

        // Prevent cartesian explosion when multiple collections are included
        .AsSplitQuery()

        .FirstOrDefaultAsync(ct);

    if (film is null) return NotFound();

    var dto = new FilmDetailsDto
    {
        Id = film.Id,
        Title = film.Title,
        EpisodeId = film.EpisodeId,
        OpeningCrawl = film.OpeningCrawl,
        Director = film.Director,
        Producer = film.Producer,
        ReleaseDate = film.ReleaseDate,

        Characters = film.FilmCharacters
            .Select(x => new NamedItemDto { Id = x.PersonId, Name = x.Person.Name })
            .OrderBy(x => x.Name)
            .ToList(),

        Planets = film.FilmPlanets
            .Select(x => new NamedItemDto { Id = x.PlanetId, Name = x.Planet.Name })
            .OrderBy(x => x.Name)
            .ToList(),

        Starships = film.FilmStarships
            .Select(x => new NamedItemDto { Id = x.StarshipId, Name = x.Starship.Name })
            .OrderBy(x => x.Name)
            .ToList(),

        Vehicles = film.FilmVehicles
            .Select(x => new NamedItemDto { Id = x.VehicleId, Name = x.Vehicle.Name })
            .OrderBy(x => x.Name)
            .ToList(),

        Species = film.FilmSpecies
            .Select(x => new NamedItemDto { Id = x.SpeciesId, Name = x.Species.Name })
            .OrderBy(x => x.Name)
            .ToList()
    };

    return Ok(dto);
}
}
