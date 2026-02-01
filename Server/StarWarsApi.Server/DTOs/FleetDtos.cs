namespace StarWarsApi.Server.Dtos;

public sealed class FleetItemDto
{
    public int StarshipId { get; set; }
    public string Name { get; set; } = "";
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }

    public int Quantity { get; set; }
    public string? Nickname { get; set; }
}

public sealed class FleetDto
{
    public int FleetId { get; set; }
    public List<FleetItemDto> Items { get; set; } = new();
}

public sealed class AddFleetItemRequest
{
    public int StarshipId { get; set; }
    public int Quantity { get; set; } = 1;
}

public sealed class UpdateFleetItemRequest
{
    public int Quantity { get; set; } = 1;
    public string? Nickname { get; set; }
}
