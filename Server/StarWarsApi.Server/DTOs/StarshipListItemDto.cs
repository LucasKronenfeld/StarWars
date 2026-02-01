namespace StarWarsApi.Server.Dtos;

public sealed class StarshipListItemDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";

    public string? Model { get; init; }
    public string? Manufacturer { get; init; }
    public string? StarshipClass { get; init; }

    public decimal? CostInCredits { get; init; }
    public double? Length { get; init; }
    public int? Crew { get; init; }
    public int? Passengers { get; init; }
    public long? CargoCapacity { get; init; }
}
