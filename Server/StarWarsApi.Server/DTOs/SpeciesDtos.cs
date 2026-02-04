namespace StarWarsApi.Server.Dtos;

public sealed class SpeciesListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Classification { get; set; }
    public string? Language { get; set; }
}

public sealed class SpeciesDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    public string? Classification { get; set; }
    public string? Designation { get; set; }
    public string? AverageHeight { get; set; }
    public string? SkinColors { get; set; }
    public string? HairColors { get; set; }
    public string? EyeColors { get; set; }
    public string? AverageLifespan { get; set; }
    public string? Language { get; set; }

    // Homeworld
    public NamedItemDto? Homeworld { get; set; }

    // Related entities
    public List<NamedItemDto> Films { get; set; } = new();
    public List<NamedItemDto> People { get; set; } = new();
}
