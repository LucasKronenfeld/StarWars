using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;
using StarWarsApi.Server.Models;

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

    // GET /api/films
    [HttpGet]
    public async Task<ActionResult<List<FilmListItemDto>>> GetAll(CancellationToken ct)
    {
        var films = await _db.Films
            .AsNoTracking()
            .OrderBy(f => f.EpisodeId)
            .Select(f => new FilmListItemDto
            {
                Id = f.Id,
                Title = f.Title,
                EpisodeId = f.EpisodeId,
                ReleaseDate = f.ReleaseDate
            })
            .ToListAsync(ct);

        return Ok(films);
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

        var filmCharacters = film.FilmCharacters ?? new List<FilmCharacter>();
        var filmPlanets = film.FilmPlanets ?? new List<FilmPlanet>();
        var filmStarships = film.FilmStarships ?? new List<FilmStarship>();
        var filmVehicles = film.FilmVehicles ?? new List<FilmVehicle>();
        var filmSpecies = film.FilmSpecies ?? new List<FilmSpecies>();

        var dto = new FilmDetailsDto
        {
            Id = film.Id,
            Title = film.Title,
            EpisodeId = film.EpisodeId,
            OpeningCrawl = film.OpeningCrawl,
            Director = film.Director,
            Producer = film.Producer,
            ReleaseDate = film.ReleaseDate,

            Characters = filmCharacters
                .Where(x => x.Person != null)
                .Select(x => new NamedItemDto
                {
                    Id = x.PersonId,
                    Name = x.Person!.Name
                })
                .OrderBy(x => x.Name)
                .ToList(),

            Planets = filmPlanets
                .Where(x => x.Planet != null)
                .Select(x => new NamedItemDto
                {
                    Id = x.PlanetId,
                    Name = x.Planet!.Name
                })
                .OrderBy(x => x.Name)
                .ToList(),

            Starships = filmStarships
                .Where(x => x.Starship != null)
                .Select(x => new NamedItemDto
                {
                    Id = x.StarshipId,
                    Name = x.Starship!.Name
                })
                .OrderBy(x => x.Name)
                .ToList(),

            Vehicles = filmVehicles
                .Where(x => x.Vehicle != null)
                .Select(x => new NamedItemDto
                {
                    Id = x.VehicleId,
                    Name = x.Vehicle!.Name
                })
                .OrderBy(x => x.Name)
                .ToList(),

            Species = filmSpecies
                .Where(x => x.Species != null)
                .Select(x => new NamedItemDto
                {
                    Id = x.SpeciesId,
                    Name = x.Species!.Name
                })
                .OrderBy(x => x.Name)
                .ToList()
        };

        return Ok(dto);
    }
}
