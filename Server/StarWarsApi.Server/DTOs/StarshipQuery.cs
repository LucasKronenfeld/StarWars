namespace StarWarsApi.Server.Dtos;

public sealed class StarshipQuery
{
    // text filters
    public string? Search { get; init; }           // name/model/manufacturer
    public string? Class { get; init; }            // StarshipClass
    public string? Manufacturer { get; init; }

    // numeric filters
    public decimal? MinCost { get; init; }
    public decimal? MaxCost { get; init; }

    public double? MinLength { get; init; }
    public double? MaxLength { get; init; }

    public int? MinCrew { get; init; }
    public int? MaxCrew { get; init; }

    public int? MinPassengers { get; init; }
    public int? MaxPassengers { get; init; }

    public long? MinCargoCapacity { get; init; }
    public long? MaxCargoCapacity { get; init; }

    // paging
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;

    // sorting (allowlist)
    public string? Sort { get; init; } = "name";   // name, model, manufacturer, class, cost, length, crew, passengers, cargo
    public string? Dir { get; init; } = "asc";     // asc|desc
}
