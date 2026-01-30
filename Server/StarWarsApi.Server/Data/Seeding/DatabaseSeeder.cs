using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Models;
using StarWarsApi.Server.Swapi;
using StarWarsApi.Server.Swapi.Dto;

namespace StarWarsApi.Server.Data.Seeding;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _db;
    private readonly SwapiClient _swapi;

    public DatabaseSeeder(ApplicationDbContext db, SwapiClient swapi)
    {
        _db = db;
        _swapi = swapi;
    }

    public async Task<object> SeedAsync(bool force, CancellationToken ct)
    {
        // If already seeded and not forcing, bail out
        if (!force && await _db.People.AnyAsync(ct))
        {
            return new { ok = true, skipped = true, reason = "Database already has data. Use ?force=true to reseed." };
        }

        if (force)
        {
            // Simple wipe order (joins first)
            _db.FilmCharacters.RemoveRange(_db.FilmCharacters);
            _db.FilmPlanets.RemoveRange(_db.FilmPlanets);
            _db.FilmStarships.RemoveRange(_db.FilmStarships);
            _db.FilmVehicles.RemoveRange(_db.FilmVehicles);
            _db.Set<FilmSpecies>().RemoveRange(_db.Set<FilmSpecies>());

            _db.PlanetResidents.RemoveRange(_db.PlanetResidents);
            _db.StarshipPilots.RemoveRange(_db.StarshipPilots);
            _db.VehiclePilots.RemoveRange(_db.VehiclePilots);
            _db.Set<SpeciesPerson>().RemoveRange(_db.Set<SpeciesPerson>());

            _db.Films.RemoveRange(_db.Films);
            _db.Starships.RemoveRange(_db.Starships);
            _db.Vehicles.RemoveRange(_db.Vehicles);
            _db.Species.RemoveRange(_db.Species);
            _db.Planets.RemoveRange(_db.Planets);
            _db.People.RemoveRange(_db.People);

            await _db.SaveChangesAsync(ct);
        }

        // Fetch all SWAPI data
        var planets = await _swapi.GetAllAsync<SwapiPlanetDto>("planets", ct);
        var species = await _swapi.GetAllAsync<SwapiSpeciesDto>("species", ct);
        var people = await _swapi.GetAllAsync<SwapiPersonDto>("people", ct);
        var films = await _swapi.GetAllAsync<SwapiFilmDto>("films", ct);
        var starships = await _swapi.GetAllAsync<SwapiStarshipDto>("starships", ct);
        var vehicles = await _swapi.GetAllAsync<SwapiVehicleDto>("vehicles", ct);

        // Maps from SWAPI URL -> local DB Id
        var planetIdByUrl = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var speciesIdByUrl = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var personIdByUrl  = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var filmIdByUrl    = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var starshipIdByUrl= new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var vehicleIdByUrl = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        // --- Insert Planets ---
        foreach (var p in planets)
        {
            var entity = new Planet
            {
                Name = p.Name ?? "",
                RotationPeriod = TryInt(p.Rotation_Period),
                OrbitalPeriod = TryInt(p.Orbital_Period),
                Diameter = TryInt(p.Diameter),
                Climate = p.Climate,
                Gravity = p.Gravity,
                Terrain = p.Terrain,
                SurfaceWater = TryInt(p.Surface_Water),
                Population = TryLong(p.Population),
            };

            _db.Planets.Add(entity);
            await _db.SaveChangesAsync(ct); // ensure Id
            planetIdByUrl[p.Url] = entity.Id;
        }

        // --- Insert Species (needs HomeworldId sometimes) ---
        foreach (var s in species)
        {
            int? homeworldId = null;
            if (!string.IsNullOrWhiteSpace(s.Homeworld) && planetIdByUrl.TryGetValue(s.Homeworld!, out var hw))
                homeworldId = hw;

            var entity = new Species
            {
                Name = s.Name ?? "",
                Classification = s.Classification,
                Designation = s.Designation,
                AverageHeight = s.Average_Height,
                SkinColors = s.Skin_Colors,
                HairColors = s.Hair_Colors,
                EyeColors = s.Eye_Colors,
                AverageLifespan = s.Average_Lifespan,
                Language = s.Language,
                HomeworldId = homeworldId
            };

            _db.Species.Add(entity);
            await _db.SaveChangesAsync(ct);
            speciesIdByUrl[s.Url] = entity.Id;
        }

        // --- Insert People (set HomeworldId) ---
        foreach (var p in people)
        {
            int? homeworldId = null;
            if (!string.IsNullOrWhiteSpace(p.Homeworld) && planetIdByUrl.TryGetValue(p.Homeworld!, out var hw))
                homeworldId = hw;

            var entity = new Person
            {
                Name = p.Name ?? "",
                Height = TryInt(p.Height),
                Mass = TryInt(p.Mass),
                HairColor = p.Hair_Color,
                SkinColor = p.Skin_Color,
                EyeColor = p.Eye_Color,
                BirthYear = p.Birth_Year,
                Gender = p.Gender,
                HomeworldId = homeworldId
            };

            _db.People.Add(entity);
            await _db.SaveChangesAsync(ct);
            personIdByUrl[p.Url] = entity.Id;
        }

        // --- Insert Films ---
        foreach (var f in films)
        {
            var entity = new Film
            {
                Title = f.Title ?? "",
                EpisodeId = f.Episode_Id,
                OpeningCrawl = f.Opening_Crawl,
                Director = f.Director,
                Producer = f.Producer,
                ReleaseDate = TryDate(f.Release_Date)?.UtcDateTime

            };

            _db.Films.Add(entity);
            await _db.SaveChangesAsync(ct);
            filmIdByUrl[f.Url] = entity.Id;
        }

        // --- Insert Starships ---
        foreach (var s in starships)
        {
            var entity = new Starship
            {
                Name = s.Name ?? "",
                Model = s.Model,
                Manufacturer = s.Manufacturer,
                StarshipClass = s.Starship_Class,
                CostInCredits = TryDecimal(s.Cost_In_Credits),
                Length = TryDouble(s.Length),
                Crew = TryInt(OnlyDigitsOrNull(s.Crew)),
                Passengers = TryInt(OnlyDigitsOrNull(s.Passengers)),
                CargoCapacity = TryLong(OnlyDigitsOrNull(s.Cargo_Capacity)),
                HyperdriveRating = TryDouble(s.Hyperdrive_Rating),
                MGLT = TryInt(OnlyDigitsOrNull(s.MGLT)),
                MaxAtmospheringSpeed = s.Max_Atmosphering_Speed,
                Consumables = s.Consumables
            };

            _db.Starships.Add(entity);
            await _db.SaveChangesAsync(ct);
            starshipIdByUrl[s.Url] = entity.Id;
        }

        // --- Insert Vehicles ---
        foreach (var v in vehicles)
        {
            var entity = new Vehicle
            {
                Name = v.Name ?? "",
                Model = v.Model,
                Manufacturer = v.Manufacturer,
                CostInCredits = v.Cost_In_Credits,
                Length = v.Length,
                MaxAtmospheringSpeed = v.Max_Atmosphering_Speed,
                Crew = v.Crew,
                Passengers = v.Passengers,
                CargoCapacity = v.Cargo_Capacity,
                Consumables = v.Consumables,
                VehicleClass = v.Vehicle_Class
            };

            _db.Vehicles.Add(entity);
            await _db.SaveChangesAsync(ct);
            vehicleIdByUrl[v.Url] = entity.Id;
        }

        // --- Join tables ---
        // Film joins
        foreach (var f in films)
        {
            if (!filmIdByUrl.TryGetValue(f.Url, out var filmId)) continue;

            foreach (var personUrl in f.Characters)
                if (personIdByUrl.TryGetValue(personUrl, out var personId))
                    _db.FilmCharacters.Add(new FilmCharacter { FilmId = filmId, PersonId = personId });

            foreach (var planetUrl in f.Planets)
                if (planetIdByUrl.TryGetValue(planetUrl, out var planetId))
                    _db.FilmPlanets.Add(new FilmPlanet { FilmId = filmId, PlanetId = planetId });

            foreach (var shipUrl in f.Starships)
                if (starshipIdByUrl.TryGetValue(shipUrl, out var shipId))
                    _db.FilmStarships.Add(new FilmStarship { FilmId = filmId, StarshipId = shipId });

            foreach (var vehicleUrl in f.Vehicles)
                if (vehicleIdByUrl.TryGetValue(vehicleUrl, out var vehicleId))
                    _db.FilmVehicles.Add(new FilmVehicle { FilmId = filmId, VehicleId = vehicleId });

            foreach (var speciesUrl in f.Species)
                if (speciesIdByUrl.TryGetValue(speciesUrl, out var speciesId))
                    _db.Set<FilmSpecies>().Add(new FilmSpecies { FilmId = filmId, SpeciesId = speciesId });
        }

        // PlanetResidents from planets endpoint
        foreach (var p in planets)
        {
            if (!planetIdByUrl.TryGetValue(p.Url, out var planetId)) continue;
            foreach (var residentUrl in p.Residents)
                if (personIdByUrl.TryGetValue(residentUrl, out var personId))
                    _db.PlanetResidents.Add(new PlanetResident { PlanetId = planetId, PersonId = personId });
        }

        // SpeciesPerson from species endpoint
        foreach (var s in species)
        {
            if (!speciesIdByUrl.TryGetValue(s.Url, out var speciesId)) continue;
            foreach (var personUrl in s.People)
                if (personIdByUrl.TryGetValue(personUrl, out var personId))
                    _db.Set<SpeciesPerson>().Add(new SpeciesPerson { SpeciesId = speciesId, PersonId = personId });
        }

        // Pilots
        foreach (var s in starships)
        {
            if (!starshipIdByUrl.TryGetValue(s.Url, out var shipId)) continue;
            foreach (var pilotUrl in s.Pilots)
                if (personIdByUrl.TryGetValue(pilotUrl, out var personId))
                    _db.StarshipPilots.Add(new StarshipPilot { StarshipId = shipId, PersonId = personId });
        }

        foreach (var v in vehicles)
        {
            if (!vehicleIdByUrl.TryGetValue(v.Url, out var vehicleId)) continue;
            foreach (var pilotUrl in v.Pilots)
                if (personIdByUrl.TryGetValue(pilotUrl, out var personId))
                    _db.VehiclePilots.Add(new VehiclePilot { VehicleId = vehicleId, PersonId = personId });
        }

        await _db.SaveChangesAsync(ct);

        return new
        {
            ok = true,
            force,
            counts = new
            {
                planets = planetIdByUrl.Count,
                species = speciesIdByUrl.Count,
                people = personIdByUrl.Count,
                films = filmIdByUrl.Count,
                starships = starshipIdByUrl.Count,
                vehicles = vehicleIdByUrl.Count
            }
        };
    }

    private static int? TryInt(string? s)
        => int.TryParse(OnlyDigitsOrNull(s), out var v) ? v : null;

    private static long? TryLong(string? s)
        => long.TryParse(OnlyDigitsOrNull(s), out var v) ? v : null;

    private static double? TryDouble(string? s)
        => double.TryParse(s, out var v) ? v : null;

    private static decimal? TryDecimal(string? s)
        => decimal.TryParse(OnlyDigitsOrNull(s), out var v) ? v : null;

    private static DateTimeOffset? TryDate(string? s)
        => DateTimeOffset.TryParse(s, out var v) ? v : null;

    private static string? OnlyDigitsOrNull(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        // SWAPI uses "unknown", "n/a", and comma-formatted numbers
        var cleaned = s.Replace(",", "").Trim();
        if (cleaned.Equals("unknown", StringComparison.OrdinalIgnoreCase)) return null;
        if (cleaned.Equals("n/a", StringComparison.OrdinalIgnoreCase)) return null;
        return cleaned;
    }
}
