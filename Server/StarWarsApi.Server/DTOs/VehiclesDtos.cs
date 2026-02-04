namespace StarWarsApi.Server.Dtos;

public sealed class VehicleListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? VehicleClass { get; set; }
}

public sealed class VehicleDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

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

    // Related entities
    public List<NamedItemDto> Films { get; set; } = new();
    public List<NamedItemDto> Pilots { get; set; } = new();
}
