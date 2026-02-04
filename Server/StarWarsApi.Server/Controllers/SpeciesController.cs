using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpeciesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SpeciesController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/species
    [HttpGet]
    public async Task<ActionResult<List<SpeciesListItemDto>>> GetAll(CancellationToken ct)
    {
        var species = await _db.Species
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SpeciesListItemDto
            {
                Id = s.Id,
                Name = s.Name,
                Classification = s.Classification,
                Language = s.Language
            })
            .ToListAsync(ct);

        return Ok(species);
    }

    // GET /api/species/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SpeciesDetailsDto>> GetById(int id, CancellationToken ct)
    {
        var species = await _db.Species
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Include(s => s.Homeworld)
            .Include(s => s.FilmSpecies).ThenInclude(fs => fs.Film)
            .Include(s => s.SpeciesPeople).ThenInclude(sp => sp.Person)
            .AsSplitQuery()
            .FirstOrDefaultAsync(ct);

        if (species is null) return NotFound();

        var dto = new SpeciesDetailsDto
        {
            Id = species.Id,
            Name = species.Name,
            Classification = species.Classification,
            Designation = species.Designation,
            AverageHeight = species.AverageHeight,
            SkinColors = species.SkinColors,
            HairColors = species.HairColors,
            EyeColors = species.EyeColors,
            AverageLifespan = species.AverageLifespan,
            Language = species.Language,

            Homeworld = species.Homeworld is not null
                ? new NamedItemDto { Id = species.Homeworld.Id, Name = species.Homeworld.Name }
                : null,

            Films = species.FilmSpecies
                .Where(fs => fs.Film is not null)
                .Select(fs => new NamedItemDto { Id = fs.FilmId, Name = fs.Film!.Title })
                .OrderBy(f => f.Name)
                .ToList(),

            People = species.SpeciesPeople
                .Where(sp => sp.Person is not null)
                .Select(sp => new NamedItemDto { Id = sp.PersonId, Name = sp.Person!.Name })
                .OrderBy(p => p.Name)
                .ToList()
        };

        return Ok(dto);
    }
}
