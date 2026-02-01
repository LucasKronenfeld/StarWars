namespace StarWarsApi.Server.Dtos;

public sealed class StarshipFiltersDto
{
    public List<string> Manufacturers { get; init; } = new();
    public List<string> Classes { get; init; } = new();

    public RangeDto<decimal> CostInCredits { get; init; } = new();
    public RangeDto<double> Length { get; init; } = new();
    public RangeDto<int> Crew { get; init; } = new();
    public RangeDto<int> Passengers { get; init; } = new();
    public RangeDto<long> CargoCapacity { get; init; } = new();
}
