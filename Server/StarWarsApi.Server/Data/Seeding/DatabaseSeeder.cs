using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Models;
using StarWarsApi.Server.Swapi;
using StarWarsApi.Server.Swapi.Dto;
using System.Text.Json;

namespace StarWarsApi.Server.Data.Seeding;

/// <summary>
/// Production-safe database seeder with upsert pipeline.
/// SWAPI data: upserted by URL (Source=swapi, SourceKey=URL)
/// Extended JSON: creates new entities only, skips if name already exists
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _db;
    private readonly ISwapiSource _swapi;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext db,
        ISwapiSource swapi,
        IWebHostEnvironment env,
        IConfiguration config,
        ILogger<DatabaseSeeder> logger)
    {
        _db = db;
        _swapi = swapi;
        _env = env;
        _config = config;
        _logger = logger;
    }

    #region Public Entry Points

    public async Task<object> SyncCatalogAsync(CancellationToken ct)
    {
        _logger.LogInformation("Production-safe catalog sync initiated");
        return await SeedOrSyncAllAsync(ct);
    }

    public async Task<object> SeedAsync(bool force, CancellationToken ct)
    {
        if (!force && await _db.People.AnyAsync(ct))
            return new { ok = true, skipped = true, reason = "Database already has data. Use ?force=true to reseed." };

        if (force)
        {
            _logger.LogWarning("Force wipe enabled - removing all catalog and user data");
            await WipeAllDataAsync(ct);
        }

        return await SeedOrSyncAllAsync(ct);
    }

    public async Task<bool> NeedsBootstrapAsync(CancellationToken ct)
    {
        return !await _db.Films.AnyAsync(ct) && !await _db.People.AnyAsync(ct);
    }

    public async Task<object> BootstrapAsync(CancellationToken ct)
    {
        if (!await NeedsBootstrapAsync(ct))
        {
            _logger.LogInformation("Database already has data - skipping bootstrap");
            return new { ok = true, skipped = true, reason = "Database already initialized" };
        }

        _logger.LogInformation("Database empty - running automatic bootstrap seeding");
        return await SeedOrSyncAllAsync(ct);
    }

    #endregion

    #region Core Seeding

    private async Task<object> SeedOrSyncAllAsync(CancellationToken ct)
    {
        // Stage 1: SWAPI (upsert by URL)
        var swapiCounts = await SeedOrSyncSwapiAsync(ct);

        // Stage 2: Extended JSON (insert new only, skip duplicates)
        object extendedCounts = new { films = 0, people = 0, planets = 0, species = 0, starships = 0, vehicles = 0 };
        if (_config.GetValue<bool>("Seed:UseExtendedJson", false))
        {
            _logger.LogInformation("Extended JSON enabled - loading additional data");
            
            // In development: fail if duplicates detected (preflight check)
            if (_env.IsDevelopment())
            {
                var duplicateCheck = await PreflightCheckExtendedJsonDuplicatesAsync(ct);
                if (duplicateCheck.HasDuplicates)
                {
                    _logger.LogError("Duplicate detection preflight failed in Development: {Duplicates}", duplicateCheck.Duplicates);
                    throw new InvalidOperationException($"Extended JSON contains duplicates of SWAPI data. Fix before deploying: {string.Join(", ", duplicateCheck.Duplicates)}");
                }
            }
            
            extendedCounts = await SeedOrSyncExtendedJsonAsync(ct);
        }

        // Stage 3: Retire SWAPI starships no longer in API
        var retireCounts = await RetireMissingStarshipsAsync(ct);

        return new
        {
            ok = true,
            swapi = swapiCounts,
            extended = extendedCounts,
            retired = retireCounts
        };
    }

    private async Task<object> SeedOrSyncSwapiAsync(CancellationToken ct)
    {
        _logger.LogInformation("Fetching all SWAPI data");

        // Fetch all data from SWAPI
        var planets = await _swapi.GetAllAsync<SwapiPlanetDto>("planets", ct);
        var species = await _swapi.GetAllAsync<SwapiSpeciesDto>("species", ct);
        var people = await _swapi.GetAllAsync<SwapiPersonDto>("people", ct);
        var films = await _swapi.GetAllAsync<SwapiFilmDto>("films", ct);
        var starships = await _swapi.GetAllAsync<SwapiStarshipDto>("starships", ct);
        var vehicles = await _swapi.GetAllAsync<SwapiVehicleDto>("vehicles", ct);

        // Build ID lookup maps: SWAPI URL -> DB Id
        var planetIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var speciesIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var personIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var filmIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var starshipIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var vehicleIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        int planetsInsert = 0, planetsUpdate = 0;
        int speciesInsert = 0, speciesUpdate = 0;
        int peopleInsert = 0, peopleUpdate = 0;
        int filmsInsert = 0, filmsUpdate = 0;
        int starshipsInsert = 0, starshipsUpdate = 0;
        int vehiclesInsert = 0, vehiclesUpdate = 0;

        // Upsert Planets
        foreach (var dto in planets)
        {
            var url = dto.Url;
            var existing = await _db.Planets.FirstOrDefaultAsync(p => p.Source == "swapi" && p.SourceKey == url, ct);

            if (existing != null)
            {
                existing.Name = dto.Name ?? "";
                existing.RotationPeriod = TryInt(dto.Rotation_Period);
                existing.OrbitalPeriod = TryInt(dto.Orbital_Period);
                existing.Diameter = TryInt(dto.Diameter);
                existing.Climate = dto.Climate;
                existing.Gravity = dto.Gravity;
                existing.Terrain = dto.Terrain;
                existing.SurfaceWater = TryInt(dto.Surface_Water);
                existing.Population = TryLong(dto.Population);
                planetIds[url] = existing.Id;
                planetsUpdate++;
            }
            else
            {
                var entity = new Planet
                {
                    Source = "swapi",
                    SourceKey = url,
                    Name = dto.Name ?? "",
                    RotationPeriod = TryInt(dto.Rotation_Period),
                    OrbitalPeriod = TryInt(dto.Orbital_Period),
                    Diameter = TryInt(dto.Diameter),
                    Climate = dto.Climate,
                    Gravity = dto.Gravity,
                    Terrain = dto.Terrain,
                    SurfaceWater = TryInt(dto.Surface_Water),
                    Population = TryLong(dto.Population)
                };
                _db.Planets.Add(entity);
                await _db.SaveChangesAsync(ct);
                planetIds[url] = entity.Id;
                planetsInsert++;
            }
        }

        // Upsert Species (with homeworld reference)
        foreach (var dto in species)
        {
            var url = dto.Url;
            var existing = await _db.Species.FirstOrDefaultAsync(s => s.Source == "swapi" && s.SourceKey == url, ct);

            int? homeworldId = null;
            if (!string.IsNullOrWhiteSpace(dto.Homeworld) && planetIds.TryGetValue(dto.Homeworld, out var hwId))
                homeworldId = hwId;

            if (existing != null)
            {
                existing.Name = dto.Name ?? "";
                existing.Classification = dto.Classification;
                existing.Designation = dto.Designation;
                existing.AverageHeight = dto.Average_Height;
                existing.SkinColors = dto.Skin_Colors;
                existing.HairColors = dto.Hair_Colors;
                existing.EyeColors = dto.Eye_Colors;
                existing.AverageLifespan = dto.Average_Lifespan;
                existing.Language = dto.Language;
                existing.HomeworldId = homeworldId;
                speciesIds[url] = existing.Id;
                speciesUpdate++;
            }
            else
            {
                var entity = new Species
                {
                    Source = "swapi",
                    SourceKey = url,
                    Name = dto.Name ?? "",
                    Classification = dto.Classification,
                    Designation = dto.Designation,
                    AverageHeight = dto.Average_Height,
                    SkinColors = dto.Skin_Colors,
                    HairColors = dto.Hair_Colors,
                    EyeColors = dto.Eye_Colors,
                    AverageLifespan = dto.Average_Lifespan,
                    Language = dto.Language,
                    HomeworldId = homeworldId
                };
                _db.Species.Add(entity);
                await _db.SaveChangesAsync(ct);
                speciesIds[url] = entity.Id;
                speciesInsert++;
            }
        }

        // Upsert People (with homeworld reference)
        foreach (var dto in people)
        {
            var url = dto.Url;
            var existing = await _db.People.FirstOrDefaultAsync(p => p.Source == "swapi" && p.SourceKey == url, ct);

            int? homeworldId = null;
            if (!string.IsNullOrWhiteSpace(dto.Homeworld) && planetIds.TryGetValue(dto.Homeworld, out var hwId))
                homeworldId = hwId;

            if (existing != null)
            {
                existing.Name = dto.Name ?? "";
                existing.Height = TryInt(dto.Height);
                existing.Mass = TryInt(dto.Mass);
                existing.HairColor = dto.Hair_Color;
                existing.SkinColor = dto.Skin_Color;
                existing.EyeColor = dto.Eye_Color;
                existing.BirthYear = dto.Birth_Year;
                existing.Gender = dto.Gender;
                existing.HomeworldId = homeworldId;
                personIds[url] = existing.Id;
                peopleUpdate++;
            }
            else
            {
                var entity = new Person
                {
                    Source = "swapi",
                    SourceKey = url,
                    Name = dto.Name ?? "",
                    Height = TryInt(dto.Height),
                    Mass = TryInt(dto.Mass),
                    HairColor = dto.Hair_Color,
                    SkinColor = dto.Skin_Color,
                    EyeColor = dto.Eye_Color,
                    BirthYear = dto.Birth_Year,
                    Gender = dto.Gender,
                    HomeworldId = homeworldId
                };
                _db.People.Add(entity);
                await _db.SaveChangesAsync(ct);
                personIds[url] = entity.Id;
                peopleInsert++;
            }
        }

        // Upsert Films
        foreach (var dto in films)
        {
            var url = dto.Url;
            var existing = await _db.Films.FirstOrDefaultAsync(f => f.Source == "swapi" && f.SourceKey == url, ct);

            if (existing != null)
            {
                existing.Title = dto.Title ?? "";
                existing.EpisodeId = dto.Episode_Id;
                existing.OpeningCrawl = dto.Opening_Crawl;
                existing.Director = dto.Director;
                existing.Producer = dto.Producer;
                existing.ReleaseDate = TryDate(dto.Release_Date)?.UtcDateTime;
                filmIds[url] = existing.Id;
                filmsUpdate++;
            }
            else
            {
                var entity = new Film
                {
                    Source = "swapi",
                    SourceKey = url,
                    Title = dto.Title ?? "",
                    EpisodeId = dto.Episode_Id,
                    OpeningCrawl = dto.Opening_Crawl,
                    Director = dto.Director,
                    Producer = dto.Producer,
                    ReleaseDate = TryDate(dto.Release_Date)?.UtcDateTime
                };
                _db.Films.Add(entity);
                await _db.SaveChangesAsync(ct);
                filmIds[url] = entity.Id;
                filmsInsert++;
            }
        }

        // Upsert Starships
        foreach (var dto in starships)
        {
            var url = dto.Url;
            var existing = await _db.Starships
                .FirstOrDefaultAsync(s => s.IsCatalog && s.Source == "swapi" && s.SourceKey == url, ct);

            if (existing != null)
            {
                existing.IsCatalog = true;
                existing.IsActive = true; // Reactivate if retired
                existing.Name = dto.Name ?? "";
                existing.Model = dto.Model;
                existing.Manufacturer = dto.Manufacturer;
                existing.StarshipClass = dto.Starship_Class;
                existing.CostInCredits = TryDecimal(dto.Cost_In_Credits);
                existing.Length = TryDouble(dto.Length);
                existing.Crew = TryInt(CleanNumber(dto.Crew));
                existing.Passengers = TryInt(CleanNumber(dto.Passengers));
                existing.CargoCapacity = TryLong(CleanNumber(dto.Cargo_Capacity));
                existing.HyperdriveRating = TryDouble(dto.Hyperdrive_Rating);
                existing.MGLT = TryInt(CleanNumber(dto.MGLT));
                existing.MaxAtmospheringSpeed = dto.Max_Atmosphering_Speed;
                existing.Consumables = dto.Consumables;
                existing.SwapiUrl = url; // Legacy field
                starshipIds[url] = existing.Id;
                starshipsUpdate++;
            }
            else
            {
                var entity = new Starship
                {
                    IsCatalog = true,
                    IsActive = true,
                    Source = "swapi",
                    SourceKey = url,
                    SwapiUrl = url,
                    Name = dto.Name ?? "",
                    Model = dto.Model,
                    Manufacturer = dto.Manufacturer,
                    StarshipClass = dto.Starship_Class,
                    CostInCredits = TryDecimal(dto.Cost_In_Credits),
                    Length = TryDouble(dto.Length),
                    Crew = TryInt(CleanNumber(dto.Crew)),
                    Passengers = TryInt(CleanNumber(dto.Passengers)),
                    CargoCapacity = TryLong(CleanNumber(dto.Cargo_Capacity)),
                    HyperdriveRating = TryDouble(dto.Hyperdrive_Rating),
                    MGLT = TryInt(CleanNumber(dto.MGLT)),
                    MaxAtmospheringSpeed = dto.Max_Atmosphering_Speed,
                    Consumables = dto.Consumables
                };
                _db.Starships.Add(entity);
                await _db.SaveChangesAsync(ct);
                starshipIds[url] = entity.Id;
                starshipsInsert++;
            }
        }

        // Upsert Vehicles
        foreach (var dto in vehicles)
        {
            var url = dto.Url;
            var existing = await _db.Vehicles.FirstOrDefaultAsync(v => v.Source == "swapi" && v.SourceKey == url, ct);

            if (existing != null)
            {
                existing.Name = dto.Name ?? "";
                existing.Model = dto.Model;
                existing.Manufacturer = dto.Manufacturer;
                existing.CostInCredits = dto.Cost_In_Credits;
                existing.Length = dto.Length;
                existing.MaxAtmospheringSpeed = dto.Max_Atmosphering_Speed;
                existing.Crew = dto.Crew;
                existing.Passengers = dto.Passengers;
                existing.CargoCapacity = dto.Cargo_Capacity;
                existing.Consumables = dto.Consumables;
                existing.VehicleClass = dto.Vehicle_Class;
                vehicleIds[url] = existing.Id;
                vehiclesUpdate++;
            }
            else
            {
                var entity = new Vehicle
                {
                    Source = "swapi",
                    SourceKey = url,
                    Name = dto.Name ?? "",
                    Model = dto.Model,
                    Manufacturer = dto.Manufacturer,
                    CostInCredits = dto.Cost_In_Credits,
                    Length = dto.Length,
                    MaxAtmospheringSpeed = dto.Max_Atmosphering_Speed,
                    Crew = dto.Crew,
                    Passengers = dto.Passengers,
                    CargoCapacity = dto.Cargo_Capacity,
                    Consumables = dto.Consumables,
                    VehicleClass = dto.Vehicle_Class
                };
                _db.Vehicles.Add(entity);
                await _db.SaveChangesAsync(ct);
                vehicleIds[url] = entity.Id;
                vehiclesInsert++;
            }
        }

        // Rebuild SWAPI relationships (clear and recreate for simplicity)
        await RebuildSwapiRelationshipsAsync(films, planets, species, starships, vehicles,
            filmIds, planetIds, speciesIds, personIds, starshipIds, vehicleIds, ct);

        return new
        {
            planets = new { inserted = planetsInsert, updated = planetsUpdate },
            species = new { inserted = speciesInsert, updated = speciesUpdate },
            people = new { inserted = peopleInsert, updated = peopleUpdate },
            films = new { inserted = filmsInsert, updated = filmsUpdate },
            starships = new { inserted = starshipsInsert, updated = starshipsUpdate },
            vehicles = new { inserted = vehiclesInsert, updated = vehiclesUpdate }
        };
    }

    private async Task RebuildSwapiRelationshipsAsync(
        List<SwapiFilmDto> films,
        List<SwapiPlanetDto> planets,
        List<SwapiSpeciesDto> species,
        List<SwapiStarshipDto> starships,
        List<SwapiVehicleDto> vehicles,
        Dictionary<string, int> filmIds,
        Dictionary<string, int> planetIds,
        Dictionary<string, int> speciesIds,
        Dictionary<string, int> personIds,
        Dictionary<string, int> starshipIds,
        Dictionary<string, int> vehicleIds,
        CancellationToken ct)
    {
        // Get all SWAPI film IDs
        var swapiFilmIds = filmIds.Values.ToHashSet();

        // Clear existing SWAPI film relationships
        var filmChars = await _db.FilmCharacters.Where(fc => swapiFilmIds.Contains(fc.FilmId)).ToListAsync(ct);
        var filmPlanets = await _db.FilmPlanets.Where(fp => swapiFilmIds.Contains(fp.FilmId)).ToListAsync(ct);
        var filmShips = await _db.FilmStarships.Where(fs => swapiFilmIds.Contains(fs.FilmId)).ToListAsync(ct);
        var filmVehicles = await _db.FilmVehicles.Where(fv => swapiFilmIds.Contains(fv.FilmId)).ToListAsync(ct);
        var filmSpecies = await _db.FilmSpecies.Where(fs => swapiFilmIds.Contains(fs.FilmId)).ToListAsync(ct);

        _db.FilmCharacters.RemoveRange(filmChars);
        _db.FilmPlanets.RemoveRange(filmPlanets);
        _db.FilmStarships.RemoveRange(filmShips);
        _db.FilmVehicles.RemoveRange(filmVehicles);
        _db.FilmSpecies.RemoveRange(filmSpecies);

        // Clear planet residents, species people, and pilots for SWAPI entities
        var swapiPlanetIds = planetIds.Values.ToHashSet();
        var swapiSpeciesIds = speciesIds.Values.ToHashSet();
        var swapiStarshipIds = starshipIds.Values.ToHashSet();
        var swapiVehicleIds = vehicleIds.Values.ToHashSet();

        var planetResidents = await _db.PlanetResidents.Where(pr => swapiPlanetIds.Contains(pr.PlanetId)).ToListAsync(ct);
        var speciesPeople = await _db.SpeciesPerson.Where(sp => swapiSpeciesIds.Contains(sp.SpeciesId)).ToListAsync(ct);
        var shipPilots = await _db.StarshipPilots.Where(sp => swapiStarshipIds.Contains(sp.StarshipId)).ToListAsync(ct);
        var vehiclePilots = await _db.VehiclePilots.Where(vp => swapiVehicleIds.Contains(vp.VehicleId)).ToListAsync(ct);

        _db.PlanetResidents.RemoveRange(planetResidents);
        _db.SpeciesPerson.RemoveRange(speciesPeople);
        _db.StarshipPilots.RemoveRange(shipPilots);
        _db.VehiclePilots.RemoveRange(vehiclePilots);

        await _db.SaveChangesAsync(ct);

        // Rebuild film relationships
        foreach (var film in films)
        {
            if (!filmIds.TryGetValue(film.Url, out var filmId)) continue;

            foreach (var charUrl in film.Characters)
                if (personIds.TryGetValue(charUrl, out var personId))
                    _db.FilmCharacters.Add(new FilmCharacter { FilmId = filmId, PersonId = personId });

            foreach (var planetUrl in film.Planets)
                if (planetIds.TryGetValue(planetUrl, out var planetId))
                    _db.FilmPlanets.Add(new FilmPlanet { FilmId = filmId, PlanetId = planetId });

            foreach (var shipUrl in film.Starships)
                if (starshipIds.TryGetValue(shipUrl, out var shipId))
                    _db.FilmStarships.Add(new FilmStarship { FilmId = filmId, StarshipId = shipId });

            foreach (var vehUrl in film.Vehicles)
                if (vehicleIds.TryGetValue(vehUrl, out var vehId))
                    _db.FilmVehicles.Add(new FilmVehicle { FilmId = filmId, VehicleId = vehId });

            foreach (var speciesUrl in film.Species)
                if (speciesIds.TryGetValue(speciesUrl, out var specId))
                    _db.FilmSpecies.Add(new FilmSpecies { FilmId = filmId, SpeciesId = specId });
        }

        // Rebuild planet residents
        foreach (var planet in planets)
        {
            if (!planetIds.TryGetValue(planet.Url, out var planetId)) continue;
            foreach (var resUrl in planet.Residents)
                if (personIds.TryGetValue(resUrl, out var personId))
                    _db.PlanetResidents.Add(new PlanetResident { PlanetId = planetId, PersonId = personId });
        }

        // Rebuild species people
        foreach (var spec in species)
        {
            if (!speciesIds.TryGetValue(spec.Url, out var specId)) continue;
            foreach (var personUrl in spec.People)
                if (personIds.TryGetValue(personUrl, out var personId))
                    _db.SpeciesPerson.Add(new SpeciesPerson { SpeciesId = specId, PersonId = personId });
        }

        // Rebuild starship pilots
        foreach (var ship in starships)
        {
            if (!starshipIds.TryGetValue(ship.Url, out var shipId)) continue;
            foreach (var pilotUrl in ship.Pilots)
                if (personIds.TryGetValue(pilotUrl, out var personId))
                    _db.StarshipPilots.Add(new StarshipPilot { StarshipId = shipId, PersonId = personId });
        }

        // Rebuild vehicle pilots
        foreach (var veh in vehicles)
        {
            if (!vehicleIds.TryGetValue(veh.Url, out var vehId)) continue;
            foreach (var pilotUrl in veh.Pilots)
                if (personIds.TryGetValue(pilotUrl, out var personId))
                    _db.VehiclePilots.Add(new VehiclePilot { VehicleId = vehId, PersonId = personId });
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task<object> SeedOrSyncExtendedJsonAsync(CancellationToken ct)
    {
        var basePath = _config["Seed:ExtendedJsonPath"] ?? "Data/Extended";
        var rootPath = Path.Combine(_env.ContentRootPath, basePath);

        if (!Directory.Exists(rootPath))
        {
            _logger.LogWarning("Extended JSON path not found: {Path}", rootPath);
            return new { films = 0, people = 0, planets = 0, species = 0, starships = 0, vehicles = 0 };
        }

        // Simple: create new entities only, skip duplicates by name
        int filmsInserted = 0, filmsSkipped = 0;
        int peopleInserted = 0, peopleSkipped = 0;
        int planetsInserted = 0, planetsSkipped = 0;
        int speciesInserted = 0, speciesSkipped = 0;
        int starshipsInserted = 0, starshipsSkipped = 0;
        int vehiclesInserted = 0, vehiclesSkipped = 0;

        // Build lookup dictionaries for relationship resolution by SourceKey (ID) OR Name/Title
        // Allows JSON relationships to reference either SWAPI URLs or human-readable names
        var planetIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var personIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var filmIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var speciesIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var starshipIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var vehicleIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        static void AddLookup(Dictionary<string, int> dict, string? key, int id)
        {
            if (string.IsNullOrWhiteSpace(key))
                return;
            if (!dict.ContainsKey(key))
                dict[key] = id;
        }

        static bool HasKey(Dictionary<string, int> dict, string? key)
        {
            return !string.IsNullOrWhiteSpace(key) && dict.ContainsKey(key);
        }

        var planets = await _db.Planets.Select(p => new { p.Id, p.Name, p.SourceKey }).ToListAsync(ct);
        foreach (var p in planets)
        {
            AddLookup(planetIds, p.SourceKey, p.Id);
            AddLookup(planetIds, p.Name, p.Id);
        }

        var people = await _db.People.Select(p => new { p.Id, p.Name, p.SourceKey }).ToListAsync(ct);
        foreach (var p in people)
        {
            AddLookup(personIds, p.SourceKey, p.Id);
            AddLookup(personIds, p.Name, p.Id);
        }

        var films = await _db.Films.Select(f => new { f.Id, f.Title, f.SourceKey }).ToListAsync(ct);
        foreach (var f in films)
        {
            AddLookup(filmIds, f.SourceKey, f.Id);
            AddLookup(filmIds, f.Title, f.Id);
        }

        var species = await _db.Species.Select(s => new { s.Id, s.Name, s.SourceKey }).ToListAsync(ct);
        foreach (var s in species)
        {
            AddLookup(speciesIds, s.SourceKey, s.Id);
            AddLookup(speciesIds, s.Name, s.Id);
        }

        var starships = await _db.Starships
            .Where(s => s.IsCatalog)
            .Select(s => new { s.Id, s.Name, s.SourceKey })
            .ToListAsync(ct);
        foreach (var s in starships)
        {
            AddLookup(starshipIds, s.SourceKey, s.Id);
            AddLookup(starshipIds, s.Name, s.Id);
        }

        var vehicles = await _db.Vehicles.Select(v => new { v.Id, v.Name, v.SourceKey }).ToListAsync(ct);
        foreach (var v in vehicles)
        {
            AddLookup(vehicleIds, v.SourceKey, v.Id);
            AddLookup(vehicleIds, v.Name, v.Id);
        }

        // Films
        var filmsPath = Path.Combine(rootPath, "films.json");
        if (File.Exists(filmsPath))
        {
            var filmsData = await LoadJsonAsync<ExtendedFilmDto>(filmsPath, ct);
            foreach (var f in filmsData)
            {
                if (string.IsNullOrWhiteSpace(f.Title))
                {
                    _logger.LogWarning("Skipping extended film with no title");
                    filmsSkipped++;
                    continue;
                }

                // Check if film already exists by SourceKey or Title
                if (HasKey(filmIds, f.Id) || HasKey(filmIds, f.Title))
                {
                    _logger.LogWarning("Skipping duplicate film: {Title} (ID: {Id})", f.Title, f.Id);
                    filmsSkipped++;
                    continue;
                }

                var entity = new Film
                {
                    Source = "extended",
                    SourceKey = f.Id ?? "",
                    Title = f.Title,
                    EpisodeId = f.EpisodeId,
                    OpeningCrawl = f.OpeningCrawl,
                    Director = f.Director,
                    Producer = f.Producer,
                    ReleaseDate = TryDate(f.ReleaseDate)?.UtcDateTime
                };
                _db.Films.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(filmIds, entity.SourceKey, entity.Id);
                AddLookup(filmIds, entity.Title, entity.Id);
                filmsInserted++;

                // Add relationships by ID (SourceKey)
                if (f.Characters != null)
                    foreach (var charId in f.Characters)
                        if (!string.IsNullOrWhiteSpace(charId) && personIds.TryGetValue(charId, out var personId))
                            _db.FilmCharacters.Add(new FilmCharacter { FilmId = entity.Id, PersonId = personId });

                if (f.Planets != null)
                    foreach (var planetId in f.Planets)
                        if (!string.IsNullOrWhiteSpace(planetId) && planetIds.TryGetValue(planetId, out var dbPlanetId))
                            _db.FilmPlanets.Add(new FilmPlanet { FilmId = entity.Id, PlanetId = dbPlanetId });

                if (f.Starships != null)
                    foreach (var shipId in f.Starships)
                        if (!string.IsNullOrWhiteSpace(shipId) && starshipIds.TryGetValue(shipId, out var dbShipId))
                            _db.FilmStarships.Add(new FilmStarship { FilmId = entity.Id, StarshipId = dbShipId });

                if (f.Vehicles != null)
                    foreach (var vehId in f.Vehicles)
                        if (!string.IsNullOrWhiteSpace(vehId) && vehicleIds.TryGetValue(vehId, out var dbVehId))
                            _db.FilmVehicles.Add(new FilmVehicle { FilmId = entity.Id, VehicleId = dbVehId });

                if (f.Species != null)
                    foreach (var specId in f.Species)
                        if (!string.IsNullOrWhiteSpace(specId) && speciesIds.TryGetValue(specId, out var dbSpecId))
                            _db.FilmSpecies.Add(new FilmSpecies { FilmId = entity.Id, SpeciesId = dbSpecId });
            }
        }

        // Planets
        var planetsPath = Path.Combine(rootPath, "planets.json");
        if (File.Exists(planetsPath))
        {
            var planetsData = await LoadJsonAsync<ExtendedPlanetDto>(planetsPath, ct);
            foreach (var p in planetsData)
            {
                if (string.IsNullOrWhiteSpace(p.Name))
                {
                    _logger.LogWarning("Skipping extended planet with no name");
                    planetsSkipped++;
                    continue;
                }

                // Check if planet already exists by SourceKey or Name
                if (HasKey(planetIds, p.Id) || HasKey(planetIds, p.Name))
                {
                    _logger.LogWarning("Skipping duplicate planet: {Name} (ID: {Id})", p.Name, p.Id);
                    planetsSkipped++;
                    continue;
                }

                var entity = new Planet
                {
                    Source = "extended",
                    SourceKey = p.Id ?? "",
                    Name = p.Name,
                    RotationPeriod = TryInt(p.RotationPeriod),
                    OrbitalPeriod = TryInt(p.OrbitalPeriod),
                    Diameter = TryInt(p.Diameter),
                    Climate = p.Climate,
                    Gravity = p.Gravity,
                    Terrain = p.Terrain,
                    SurfaceWater = TryInt(p.SurfaceWater),
                    Population = TryLong(p.Population)
                };
                _db.Planets.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(planetIds, entity.SourceKey, entity.Id);
                AddLookup(planetIds, entity.Name, entity.Id);
                planetsInserted++;

                // Add residents if they exist by ID (SourceKey)
                if (p.Residents != null)
                    foreach (var residentId in p.Residents)
                        if (!string.IsNullOrWhiteSpace(residentId) && personIds.TryGetValue(residentId, out var personId))
                            _db.PlanetResidents.Add(new PlanetResident { PlanetId = entity.Id, PersonId = personId });

                // Add films if they reference this planet by ID (SourceKey)
                if (p.Films != null)
                    foreach (var filmId in p.Films)
                        if (!string.IsNullOrWhiteSpace(filmId) && filmIds.TryGetValue(filmId, out var dbFilmId))
                            _db.FilmPlanets.Add(new FilmPlanet { FilmId = dbFilmId, PlanetId = entity.Id });
            }
        }

        // Species
        var speciesPath = Path.Combine(rootPath, "species.json");
        if (File.Exists(speciesPath))
        {
            var speciesData = await LoadJsonAsync<ExtendedSpeciesDto>(speciesPath, ct);
            foreach (var s in speciesData)
            {
                if (string.IsNullOrWhiteSpace(s.Name))
                {
                    _logger.LogWarning("Skipping extended species with no name");
                    speciesSkipped++;
                    continue;
                }

                // Check if species already exists by SourceKey or Name
                if (HasKey(speciesIds, s.Id) || HasKey(speciesIds, s.Name))
                {
                    _logger.LogWarning("Skipping duplicate species: {Name} (ID: {Id})", s.Name, s.Id);
                    speciesSkipped++;
                    continue;
                }

                int? homeworldId = null;
                if (!string.IsNullOrWhiteSpace(s.Homeworld) && planetIds.TryGetValue(s.Homeworld, out var hwId))
                    homeworldId = hwId;

                var entity = new Species
                {
                    Source = "extended",
                    SourceKey = s.Id ?? "",
                    Name = s.Name,
                    Classification = s.Classification,
                    Designation = s.Designation,
                    AverageHeight = s.AverageHeight,
                    SkinColors = s.SkinColors,
                    HairColors = s.HairColors,
                    EyeColors = s.EyeColors,
                    AverageLifespan = s.AverageLifespan,
                    Language = s.Language,
                    HomeworldId = homeworldId
                };
                _db.Species.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(speciesIds, entity.SourceKey, entity.Id);
                AddLookup(speciesIds, entity.Name, entity.Id);
                speciesInserted++;

                // Add species-person relationships
                if (s.People != null)
                    foreach (var personId in s.People)
                        if (!string.IsNullOrWhiteSpace(personId) && personIds.TryGetValue(personId, out var dbPersonId))
                            _db.SpeciesPerson.Add(new SpeciesPerson { SpeciesId = entity.Id, PersonId = dbPersonId });

                // Add films if they reference this species by ID (SourceKey)
                if (s.Films != null)
                    foreach (var filmId in s.Films)
                        if (!string.IsNullOrWhiteSpace(filmId) && filmIds.TryGetValue(filmId, out var dbFilmId))
                            _db.FilmSpecies.Add(new FilmSpecies { FilmId = dbFilmId, SpeciesId = entity.Id });
            }
        }

        // People
        var peoplePath = Path.Combine(rootPath, "people.json");
        if (File.Exists(peoplePath))
        {
            var peopleData = await LoadJsonAsync<ExtendedPersonDto>(peoplePath, ct);
            foreach (var p in peopleData)
            {
                if (string.IsNullOrWhiteSpace(p.Name))
                {
                    _logger.LogWarning("Skipping extended person with no name");
                    peopleSkipped++;
                    continue;
                }

                // Check if person already exists by SourceKey or Name
                if (HasKey(personIds, p.Id) || HasKey(personIds, p.Name))
                {
                    _logger.LogWarning("Skipping duplicate person: {Name} (ID: {Id})", p.Name, p.Id);
                    peopleSkipped++;
                    continue;
                }

                int? homeworldId = null;
                if (!string.IsNullOrWhiteSpace(p.Homeworld) && planetIds.TryGetValue(p.Homeworld, out var hwId))
                    homeworldId = hwId;

                var entity = new Person
                {
                    Source = "extended",
                    SourceKey = p.Id ?? "",
                    Name = p.Name,
                    Height = TryInt(p.Height),
                    Mass = TryInt(p.Mass),
                    HairColor = p.HairColor,
                    SkinColor = p.SkinColor,
                    EyeColor = p.EyeColor,
                    BirthYear = p.BirthYear,
                    Gender = p.Gender,
                    HomeworldId = homeworldId
                };
                _db.People.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(personIds, entity.SourceKey, entity.Id);
                AddLookup(personIds, entity.Name, entity.Id);
                peopleInserted++;

                // Add film relationships by ID (SourceKey)
                if (p.Films != null)
                    foreach (var filmId in p.Films)
                        if (!string.IsNullOrWhiteSpace(filmId) && filmIds.TryGetValue(filmId, out var dbFilmId))
                            _db.FilmCharacters.Add(new FilmCharacter { FilmId = dbFilmId, PersonId = entity.Id });

                // Add species relationships by ID (SourceKey)
                if (p.Species != null)
                    foreach (var specId in p.Species)
                        if (!string.IsNullOrWhiteSpace(specId) && speciesIds.TryGetValue(specId, out var dbSpecId))
                            _db.SpeciesPerson.Add(new SpeciesPerson { SpeciesId = dbSpecId, PersonId = entity.Id });

                // Add starship pilot relationships by ID (SourceKey)
                if (p.Starships != null)
                    foreach (var shipId in p.Starships)
                        if (!string.IsNullOrWhiteSpace(shipId) && starshipIds.TryGetValue(shipId, out var dbShipId))
                            _db.StarshipPilots.Add(new StarshipPilot { StarshipId = dbShipId, PersonId = entity.Id });

                // Add vehicle pilot relationships by ID (SourceKey)
                if (p.Vehicles != null)
                    foreach (var vehId in p.Vehicles)
                        if (!string.IsNullOrWhiteSpace(vehId) && vehicleIds.TryGetValue(vehId, out var dbVehId))
                            _db.VehiclePilots.Add(new VehiclePilot { VehicleId = dbVehId, PersonId = entity.Id });
            }
        }

        // Starships
        var starshipsPath = Path.Combine(rootPath, "starships.json");
        if (File.Exists(starshipsPath))
        {
            var starshipsData = await LoadJsonAsync<ExtendedStarshipDto>(starshipsPath, ct);
            foreach (var s in starshipsData)
            {
                if (string.IsNullOrWhiteSpace(s.Name))
                {
                    _logger.LogWarning("Skipping extended starship with no name");
                    starshipsSkipped++;
                    continue;
                }

                // Check if starship already exists by SourceKey or Name
                if (HasKey(starshipIds, s.Id) || HasKey(starshipIds, s.Name))
                {
                    _logger.LogWarning("Skipping duplicate starship: {Name} (ID: {Id})", s.Name, s.Id);
                    starshipsSkipped++;
                    continue;
                }

                var entity = new Starship
                {
                    IsCatalog = true,
                    IsActive = true,
                    Source = "extended",
                    SourceKey = s.Id ?? "",
                    Name = s.Name,
                    Model = s.Model,
                    Manufacturer = s.Manufacturer,
                    StarshipClass = s.StarshipClass,
                    CostInCredits = TryDecimal(s.CostInCredits),
                    Length = TryDouble(s.Length),
                    Crew = TryInt(s.Crew),
                    Passengers = TryInt(s.Passengers),
                    CargoCapacity = TryLong(s.CargoCapacity),
                    HyperdriveRating = TryDouble(s.HyperdriveRating),
                    MGLT = TryInt(s.MGLT),
                    MaxAtmospheringSpeed = s.MaxAtmospheringSpeed,
                    Consumables = s.Consumables
                };
                _db.Starships.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(starshipIds, entity.SourceKey, entity.Id);
                AddLookup(starshipIds, entity.Name, entity.Id);
                starshipsInserted++;

                // Add pilot relationships by ID (SourceKey)
                if (s.Pilots != null)
                    foreach (var pilotId in s.Pilots)
                        if (!string.IsNullOrWhiteSpace(pilotId) && personIds.TryGetValue(pilotId, out var personId))
                            _db.StarshipPilots.Add(new StarshipPilot { StarshipId = entity.Id, PersonId = personId });

                // Add film relationships by ID (SourceKey)
                if (s.Films != null)
                    foreach (var filmId in s.Films)
                        if (!string.IsNullOrWhiteSpace(filmId) && filmIds.TryGetValue(filmId, out var dbFilmId))
                            _db.FilmStarships.Add(new FilmStarship { FilmId = dbFilmId, StarshipId = entity.Id });
            }
        }

        // Vehicles
        var vehiclesPath = Path.Combine(rootPath, "vehicles.json");
        if (File.Exists(vehiclesPath))
        {
            var vehiclesData = await LoadJsonAsync<ExtendedVehicleDto>(vehiclesPath, ct);
            foreach (var v in vehiclesData)
            {
                if (string.IsNullOrWhiteSpace(v.Name))
                {
                    _logger.LogWarning("Skipping extended vehicle with no name");
                    vehiclesSkipped++;
                    continue;
                }

                // Check if vehicle already exists by SourceKey or Name
                if (HasKey(vehicleIds, v.Id) || HasKey(vehicleIds, v.Name))
                {
                    _logger.LogWarning("Skipping duplicate vehicle: {Name} (ID: {Id})", v.Name, v.Id);
                    vehiclesSkipped++;
                    continue;
                }

                var entity = new Vehicle
                {
                    Source = "extended",
                    SourceKey = v.Id ?? "",
                    Name = v.Name,
                    Model = v.Model,
                    Manufacturer = v.Manufacturer,
                    CostInCredits = v.CostInCredits,
                    Length = v.Length,
                    MaxAtmospheringSpeed = v.MaxAtmospheringSpeed,
                    Crew = v.Crew,
                    Passengers = v.Passengers,
                    CargoCapacity = v.CargoCapacity,
                    Consumables = v.Consumables,
                    VehicleClass = v.VehicleClass
                };
                _db.Vehicles.Add(entity);
                await _db.SaveChangesAsync(ct);
                AddLookup(vehicleIds, entity.SourceKey, entity.Id);
                AddLookup(vehicleIds, entity.Name, entity.Id);
                vehiclesInserted++;

                // Add pilot relationships by ID (SourceKey)
                if (v.Pilots != null)
                    foreach (var pilotId in v.Pilots)
                        if (!string.IsNullOrWhiteSpace(pilotId) && personIds.TryGetValue(pilotId, out var personId))
                            _db.VehiclePilots.Add(new VehiclePilot { VehicleId = entity.Id, PersonId = personId });

                // Add film relationships by ID (SourceKey)
                if (v.Films != null)
                    foreach (var filmId in v.Films)
                        if (!string.IsNullOrWhiteSpace(filmId) && filmIds.TryGetValue(filmId, out var dbFilmId))
                            _db.FilmVehicles.Add(new FilmVehicle { FilmId = dbFilmId, VehicleId = entity.Id });
            }
        }

        await _db.SaveChangesAsync(ct);

        return new
        {
            films = new { inserted = filmsInserted, skipped = filmsSkipped },
            people = new { inserted = peopleInserted, skipped = peopleSkipped },
            planets = new { inserted = planetsInserted, skipped = planetsSkipped },
            species = new { inserted = speciesInserted, skipped = speciesSkipped },
            starships = new { inserted = starshipsInserted, skipped = starshipsSkipped },
            vehicles = new { inserted = vehiclesInserted, skipped = vehiclesSkipped }
        };
    }

    private async Task<object> RetireMissingStarshipsAsync(CancellationToken ct)
    {
        // Retire SWAPI catalog starships that are no longer in SWAPI
        var swapiStarships = await _swapi.GetAllAsync<SwapiStarshipDto>("starships", ct);
        var swapiUrls = new HashSet<string>(swapiStarships.Select(s => s.Url), StringComparer.OrdinalIgnoreCase);

        var catalogStarships = await _db.Starships
            .Where(s => s.IsCatalog && s.Source == "swapi" && s.SourceKey != null)
            .ToListAsync(ct);

        int retired = 0;
        foreach (var ship in catalogStarships)
        {
            if (!swapiUrls.Contains(ship.SourceKey!) && ship.IsActive)
            {
                ship.IsActive = false;
                retired++;
            }
        }

        await _db.SaveChangesAsync(ct);

        return new { starships = retired };
    }

    #endregion

    #region Helper Methods

    private async Task WipeAllDataAsync(CancellationToken ct)
    {
        // Remove joins first
        _db.FilmCharacters.RemoveRange(_db.FilmCharacters);
        _db.FilmPlanets.RemoveRange(_db.FilmPlanets);
        _db.FilmStarships.RemoveRange(_db.FilmStarships);
        _db.FilmVehicles.RemoveRange(_db.FilmVehicles);
        _db.FilmSpecies.RemoveRange(_db.FilmSpecies);
        _db.PlanetResidents.RemoveRange(_db.PlanetResidents);
        _db.StarshipPilots.RemoveRange(_db.StarshipPilots);
        _db.VehiclePilots.RemoveRange(_db.VehiclePilots);
        _db.SpeciesPerson.RemoveRange(_db.SpeciesPerson);

        // Remove fleets (preserves Fleet table structure but removes all user fleet data)
        _db.FleetStarships.RemoveRange(_db.FleetStarships);
        _db.Fleets.RemoveRange(_db.Fleets);

        // Remove entities
        _db.Films.RemoveRange(_db.Films);
        _db.Starships.RemoveRange(_db.Starships);
        _db.Vehicles.RemoveRange(_db.Vehicles);
        _db.Species.RemoveRange(_db.Species);
        _db.Planets.RemoveRange(_db.Planets);
        _db.People.RemoveRange(_db.People);

        await _db.SaveChangesAsync(ct);
    }

    private async Task<List<T>> LoadJsonAsync<T>(string path, CancellationToken ct) where T : class
    {
        var json = await File.ReadAllTextAsync(path, ct);
        var container = JsonSerializer.Deserialize<ExtendedDataFile<T>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        return container?.Data ?? new List<T>();
    }

    private static int? TryInt(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        var cleaned = CleanNumber(s);
        return int.TryParse(cleaned, out var v) ? v : null;
    }

    private static long? TryLong(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        var cleaned = CleanNumber(s);
        return long.TryParse(cleaned, out var v) ? v : null;
    }

    private static double? TryDouble(string? s)
        => double.TryParse(s, out var v) ? v : null;

    private static decimal? TryDecimal(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        var cleaned = CleanNumber(s);
        return decimal.TryParse(cleaned, out var v) ? v : null;
    }

    private static DateTimeOffset? TryDate(string? s)
        => DateTimeOffset.TryParse(s, out var v) ? v : null;

    private static string CleanNumber(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "";
        var cleaned = s.Replace(",", "").Trim();
        if (cleaned.Equals("unknown", StringComparison.OrdinalIgnoreCase)) return "";
        if (cleaned.Equals("n/a", StringComparison.OrdinalIgnoreCase)) return "";
        return cleaned;
    }

    #endregion

    #region Duplicate Preflight Check

    private async Task<(bool HasDuplicates, List<string> Duplicates)> PreflightCheckExtendedJsonDuplicatesAsync(CancellationToken ct)
    {
        var duplicates = new List<string>();
        var basePath = _config["Seed:ExtendedJsonPath"] ?? "Data/Extended";
        var rootPath = Path.Combine(_env.ContentRootPath, basePath);

        if (!Directory.Exists(rootPath))
            return (false, duplicates);

        // Load existing SWAPI data
        var existingFilms = await _db.Films.Where(f => f.Source == "swapi").Select(f => f.Title).ToListAsync(ct);
        var existingPeople = await _db.People.Where(p => p.Source == "swapi").Select(p => p.Name).ToListAsync(ct);
        var existingPlanets = await _db.Planets.Where(p => p.Source == "swapi").Select(p => p.Name).ToListAsync(ct);
        var existingSpecies = await _db.Species.Where(s => s.Source == "swapi").Select(s => s.Name).ToListAsync(ct);
        var existingStarships = await _db.Starships.Where(s => s.Source == "swapi" && s.IsCatalog).Select(s => s.Name).ToListAsync(ct);
        var existingVehicles = await _db.Vehicles.Where(v => v.Source == "swapi").Select(v => v.Name).ToListAsync(ct);

        // Check films
        var filmsPath = Path.Combine(rootPath, "films.json");
        if (File.Exists(filmsPath))
        {
            var filmsData = await LoadJsonAsync<ExtendedFilmDto>(filmsPath, ct);
            foreach (var f in filmsData.Where(f => !string.IsNullOrWhiteSpace(f.Title)))
            {
                if (existingFilms.Any(existing => existing.Equals(f.Title, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Film: {f.Title}");
            }
        }

        // Check people
        var peoplePath = Path.Combine(rootPath, "people.json");
        if (File.Exists(peoplePath))
        {
            var peopleData = await LoadJsonAsync<ExtendedPersonDto>(peoplePath, ct);
            foreach (var p in peopleData.Where(p => !string.IsNullOrWhiteSpace(p.Name)))
            {
                if (existingPeople.Any(existing => existing.Equals(p.Name, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Person: {p.Name}");
            }
        }

        // Check planets
        var planetsPath = Path.Combine(rootPath, "planets.json");
        if (File.Exists(planetsPath))
        {
            var planetsData = await LoadJsonAsync<ExtendedPlanetDto>(planetsPath, ct);
            foreach (var p in planetsData.Where(p => !string.IsNullOrWhiteSpace(p.Name)))
            {
                if (existingPlanets.Any(existing => existing.Equals(p.Name, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Planet: {p.Name}");
            }
        }

        // Check species
        var speciesPath = Path.Combine(rootPath, "species.json");
        if (File.Exists(speciesPath))
        {
            var speciesData = await LoadJsonAsync<ExtendedSpeciesDto>(speciesPath, ct);
            foreach (var s in speciesData.Where(s => !string.IsNullOrWhiteSpace(s.Name)))
            {
                if (existingSpecies.Any(existing => existing.Equals(s.Name, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Species: {s.Name}");
            }
        }

        // Check starships
        var starshipsPath = Path.Combine(rootPath, "starships.json");
        if (File.Exists(starshipsPath))
        {
            var starshipsData = await LoadJsonAsync<ExtendedStarshipDto>(starshipsPath, ct);
            foreach (var s in starshipsData.Where(s => !string.IsNullOrWhiteSpace(s.Name)))
            {
                if (existingStarships.Any(existing => existing.Equals(s.Name, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Starship: {s.Name}");
            }
        }

        // Check vehicles
        var vehiclesPath = Path.Combine(rootPath, "vehicles.json");
        if (File.Exists(vehiclesPath))
        {
            var vehiclesData = await LoadJsonAsync<ExtendedVehicleDto>(vehiclesPath, ct);
            foreach (var v in vehiclesData.Where(v => !string.IsNullOrWhiteSpace(v.Name)))
            {
                if (existingVehicles.Any(existing => existing.Equals(v.Name, StringComparison.OrdinalIgnoreCase)))
                    duplicates.Add($"Vehicle: {v.Name}");
            }
        }

        return (duplicates.Any(), duplicates);
    }

    #endregion
}
