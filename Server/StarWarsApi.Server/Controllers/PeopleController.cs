using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PeopleController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PeopleController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/people
    [HttpGet]
    public async Task<ActionResult<List<PersonListItemDto>>> GetAll(CancellationToken ct)
    {
        var people = await _db.People
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new PersonListItemDto
            {
                Id = p.Id,
                Name = p.Name,
                Gender = p.Gender,
                BirthYear = p.BirthYear
            })
            .ToListAsync(ct);

        return Ok(people);
    }

    // GET /api/people/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PersonDetailsDto>> GetById(int id, CancellationToken ct)
    {
        var person = await _db.People
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Include(p => p.Homeworld)
            .Include(p => p.FilmCharacters).ThenInclude(fc => fc.Film)
            .Include(p => p.StarshipPilots).ThenInclude(sp => sp.Starship)
            .Include(p => p.VehiclePilots).ThenInclude(vp => vp.Vehicle)
            .Include(p => p.SpeciesPeople).ThenInclude(sp => sp.Species)
            .AsSplitQuery()
            .FirstOrDefaultAsync(ct);

        if (person is null) return NotFound();

        var dto = new PersonDetailsDto
        {
            Id = person.Id,
            Name = person.Name,
            Height = person.Height,
            Mass = person.Mass,
            HairColor = person.HairColor,
            SkinColor = person.SkinColor,
            EyeColor = person.EyeColor,
            BirthYear = person.BirthYear,
            Gender = person.Gender,

            Homeworld = person.Homeworld is not null
                ? new NamedItemDto { Id = person.Homeworld.Id, Name = person.Homeworld.Name }
                : null,

            Films = person.FilmCharacters
                .Where(fc => fc.Film is not null)
                .Select(fc => new NamedItemDto { Id = fc.FilmId, Name = fc.Film!.Title })
                .OrderBy(f => f.Name)
                .ToList(),

            Starships = person.StarshipPilots
                .Where(sp => sp.Starship is not null)
                .Select(sp => new NamedItemDto { Id = sp.StarshipId, Name = sp.Starship!.Name })
                .OrderBy(s => s.Name)
                .ToList(),

            Vehicles = person.VehiclePilots
                .Where(vp => vp.Vehicle is not null)
                .Select(vp => new NamedItemDto { Id = vp.VehicleId, Name = vp.Vehicle!.Name })
                .OrderBy(v => v.Name)
                .ToList(),

            Species = person.SpeciesPeople
                .Where(sp => sp.Species is not null)
                .Select(sp => new NamedItemDto { Id = sp.SpeciesId, Name = sp.Species!.Name })
                .OrderBy(s => s.Name)
                .ToList()
        };

        return Ok(dto);
    }
}
