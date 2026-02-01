namespace StarWarsApi.Server.Dtos;

public sealed class FleetQuery
{
    public string? Search { get; set; }
    public string? Class { get; set; }
    public string? Manufacturer { get; set; }

    public decimal? MinCost { get; set; }
    public decimal? MaxCost { get; set; }
    public double? MinLength { get; set; }
    public double? MaxLength { get; set; }
    public int? MinCrew { get; set; }
    public int? MaxCrew { get; set; }

    public string? Sort { get; set; } // name, manufacturer, class, cost, length, crew, addedAt, quantity
    public string? Dir { get; set; }  // asc/desc

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class FleetListItemDto
{
    public int StarshipId { get; set; }
    public string Name { get; set; } = "";
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }

    public decimal? CostInCredits { get; set; }
    public double? Length { get; set; }
    public int? Crew { get; set; }

    public int Quantity { get; set; }
    public string? Nickname { get; set; }
    public DateTime AddedAt { get; set; }

    public bool IsCatalog { get; set; } // useful later in UI
}
