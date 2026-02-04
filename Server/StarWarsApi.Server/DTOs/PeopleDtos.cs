namespace StarWarsApi.Server.Dtos;

public sealed class PersonListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Gender { get; set; }
    public string? BirthYear { get; set; }
}

public sealed class PersonDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    // Physical characteristics
    public int? Height { get; set; }
    public int? Mass { get; set; }
    public string? HairColor { get; set; }
    public string? SkinColor { get; set; }
    public string? EyeColor { get; set; }

    // Personal data
    public string? BirthYear { get; set; }
    public string? Gender { get; set; }

    // Homeworld
    public NamedItemDto? Homeworld { get; set; }

    // Related entities
    public List<NamedItemDto> Films { get; set; } = new();
    public List<NamedItemDto> Starships { get; set; } = new();
    public List<NamedItemDto> Vehicles { get; set; } = new();
    public List<NamedItemDto> Species { get; set; } = new();
}
