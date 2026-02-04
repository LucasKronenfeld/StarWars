namespace StarWarsApi.Server.Dtos;

public sealed class PlanetListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Climate { get; set; }
    public string? Terrain { get; set; }
    public long? Population { get; set; }
}

public sealed class PlanetDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    // Orbital data
    public int? RotationPeriod { get; set; }
    public int? OrbitalPeriod { get; set; }
    public int? Diameter { get; set; }

    // Environmental data
    public string? Climate { get; set; }
    public string? Gravity { get; set; }
    public string? Terrain { get; set; }

    // Population data
    public int? SurfaceWater { get; set; }
    public long? Population { get; set; }

    // Related entities
    public List<NamedItemDto> Films { get; set; } = new();
    public List<NamedItemDto> Residents { get; set; } = new();
}
