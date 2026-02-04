using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Dtos;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public VehiclesController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/vehicles
    [HttpGet]
    public async Task<ActionResult<List<VehicleListItemDto>>> GetAll(CancellationToken ct)
    {
        var vehicles = await _db.Vehicles
            .AsNoTracking()
            .OrderBy(v => v.Name)
            .Select(v => new VehicleListItemDto
            {
                Id = v.Id,
                Name = v.Name,
                Model = v.Model,
                Manufacturer = v.Manufacturer,
                VehicleClass = v.VehicleClass
            })
            .ToListAsync(ct);

        return Ok(vehicles);
    }

    // GET /api/vehicles/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VehicleDetailsDto>> GetById(int id, CancellationToken ct)
    {
        var vehicle = await _db.Vehicles
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Include(v => v.FilmVehicles).ThenInclude(fv => fv.Film)
            .Include(v => v.VehiclePilots).ThenInclude(vp => vp.Person)
            .AsSplitQuery()
            .FirstOrDefaultAsync(ct);

        if (vehicle is null) return NotFound();

        var dto = new VehicleDetailsDto
        {
            Id = vehicle.Id,
            Name = vehicle.Name,
            Model = vehicle.Model,
            Manufacturer = vehicle.Manufacturer,
            CostInCredits = vehicle.CostInCredits,
            Length = vehicle.Length,
            MaxAtmospheringSpeed = vehicle.MaxAtmospheringSpeed,
            Crew = vehicle.Crew,
            Passengers = vehicle.Passengers,
            CargoCapacity = vehicle.CargoCapacity,
            Consumables = vehicle.Consumables,
            VehicleClass = vehicle.VehicleClass,

            Films = vehicle.FilmVehicles
                .Where(fv => fv.Film is not null)
                .Select(fv => new NamedItemDto { Id = fv.FilmId, Name = fv.Film!.Title })
                .OrderBy(f => f.Name)
                .ToList(),

            Pilots = vehicle.VehiclePilots
                .Where(vp => vp.Person is not null)
                .Select(vp => new NamedItemDto { Id = vp.PersonId, Name = vp.Person!.Name })
                .OrderBy(p => p.Name)
                .ToList()
        };

        return Ok(dto);
    }
}
