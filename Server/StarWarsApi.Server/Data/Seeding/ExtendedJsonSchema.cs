namespace StarWarsApi.Server.Data.Seeding;

/// <summary>
/// Extended JSON schema for loading additional Star Wars data beyond SWAPI.
/// Supports creating new entities or merging into existing SWAPI entities via sameAs.
/// </summary>
/// 
public class ExtendedFilmDto
{
    /// <summary>Unique ID for this extended entity (becomes SourceKey)</summary>
    public string Id { get; set; } = string.Empty;
    
    /// <summary>Optional SWAPI URL to merge into existing entity instead of creating new</summary>
    public string? SameAs { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public int EpisodeId { get; set; }
    public string? OpeningCrawl { get; set; }
    public string? Director { get; set; }
    public string? Producer { get; set; }
    public string? ReleaseDate { get; set; }
    
    /// <summary>Array of character IDs (SWAPI urls or extended ids)</summary>
    public List<string> Characters { get; set; } = new();
    
    /// <summary>Array of planet IDs (SWAPI urls or extended ids)</summary>
    public List<string> Planets { get; set; } = new();
    
    /// <summary>Array of starship IDs (SWAPI urls or extended ids)</summary>
    public List<string> Starships { get; set; } = new();
    
    /// <summary>Array of vehicle IDs (SWAPI urls or extended ids)</summary>
    public List<string> Vehicles { get; set; } = new();
    
    /// <summary>Array of species IDs (SWAPI urls or extended ids)</summary>
    public List<string> Species { get; set; } = new();
}

public class ExtendedPersonDto
{
    public string Id { get; set; } = string.Empty;
    public string? SameAs { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? Height { get; set; }
    public string? Mass { get; set; }
    public string? HairColor { get; set; }
    public string? SkinColor { get; set; }
    public string? EyeColor { get; set; }
    public string? BirthYear { get; set; }
    public string? Gender { get; set; }
    
    /// <summary>Homeworld ID (SWAPI url or extended id)</summary>
    public string? Homeworld { get; set; }
    
    /// <summary>Array of film IDs this person appears in</summary>
    public List<string> Films { get; set; } = new();
    
    /// <summary>Array of species IDs</summary>
    public List<string> Species { get; set; } = new();
    
    /// <summary>Array of starship IDs this person pilots</summary>
    public List<string> Starships { get; set; } = new();
    
    /// <summary>Array of vehicle IDs this person pilots</summary>
    public List<string> Vehicles { get; set; } = new();
}

public class ExtendedPlanetDto
{
    public string Id { get; set; } = string.Empty;
    public string? SameAs { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? RotationPeriod { get; set; }
    public string? OrbitalPeriod { get; set; }
    public string? Diameter { get; set; }
    public string? Climate { get; set; }
    public string? Gravity { get; set; }
    public string? Terrain { get; set; }
    public string? SurfaceWater { get; set; }
    public string? Population { get; set; }
    
    /// <summary>Array of resident person IDs</summary>
    public List<string> Residents { get; set; } = new();
    
    /// <summary>Array of film IDs</summary>
    public List<string> Films { get; set; } = new();
}

public class ExtendedSpeciesDto
{
    public string Id { get; set; } = string.Empty;
    public string? SameAs { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? Classification { get; set; }
    public string? Designation { get; set; }
    public string? AverageHeight { get; set; }
    public string? SkinColors { get; set; }
    public string? HairColors { get; set; }
    public string? EyeColors { get; set; }
    public string? AverageLifespan { get; set; }
    public string? Language { get; set; }
    
    /// <summary>Homeworld ID (SWAPI url or extended id)</summary>
    public string? Homeworld { get; set; }
    
    /// <summary>Array of person IDs belonging to this species</summary>
    public List<string> People { get; set; } = new();
    
    /// <summary>Array of film IDs</summary>
    public List<string> Films { get; set; } = new();
}

public class ExtendedStarshipDto
{
    public string Id { get; set; } = string.Empty;
    public string? SameAs { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? CostInCredits { get; set; }
    public string? Length { get; set; }
    public string? MaxAtmospheringSpeed { get; set; }
    public string? Crew { get; set; }
    public string? Passengers { get; set; }
    public string? CargoCapacity { get; set; }
    public string? Consumables { get; set; }
    public string? HyperdriveRating { get; set; }
    public string? MGLT { get; set; }
    public string? StarshipClass { get; set; }
    
    /// <summary>Array of pilot person IDs</summary>
    public List<string> Pilots { get; set; } = new();
    
    /// <summary>Array of film IDs</summary>
    public List<string> Films { get; set; } = new();
}

public class ExtendedVehicleDto
{
    public string Id { get; set; } = string.Empty;
    public string? SameAs { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? CostInCredits { get; set; }
    public string? Length { get; set; }
    public string? MaxAtmospheringSpeed { get; set; }
    public string? Crew { get; set; }
    public string? Passengers { get; set; }
    public string? CargoCapacity { get; set; }
    public string? Consumables { get; set; }
    public string? VehicleClass { get; set; }
    
    /// <summary>Array of pilot person IDs</summary>
    public List<string> Pilots { get; set; } = new();
    
    /// <summary>Array of film IDs</summary>
    public List<string> Films { get; set; } = new();
}

/// <summary>
/// Root container for extended data JSON files
/// </summary>
public class ExtendedDataFile<T> where T : class
{
    public List<T> Data { get; set; } = new();
}
