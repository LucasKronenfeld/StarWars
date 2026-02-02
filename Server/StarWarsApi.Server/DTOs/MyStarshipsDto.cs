public sealed class MyStarshipsQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;

    public string? Search { get; set; }
    public string? Manufacturer { get; set; }
    public string? Class { get; set; }

    public decimal? CostMin { get; set; }
    public decimal? CostMax { get; set; }

    public double? LengthMin { get; set; }
    public double? LengthMax { get; set; }

    public int? CrewMin { get; set; }
    public int? CrewMax { get; set; }

    public int? PassengersMin { get; set; }
    public int? PassengersMax { get; set; }

    public long? CargoMin { get; set; }
    public long? CargoMax { get; set; }

    public string? SortBy { get; set; } = "name";
    public string? SortDir { get; set; } = "asc";
}

public class MyStarshipListItemDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }

    public decimal? CostInCredits { get; set; }
    public double? Length { get; set; }
    public int? Crew { get; set; }
    public int? Passengers { get; set; }
    public long? CargoCapacity { get; set; }

    public string? Consumables { get; set; }
    public double? HyperdriveRating { get; set; }
    public int? MGLT { get; set; }

    public int? BaseStarshipId { get; set; }
}

public sealed class CreateMyStarshipRequest
{
    public string Name { get; set; } = "";

    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }

    public decimal? CostInCredits { get; set; }
    public double? Length { get; set; }
    public int? Crew { get; set; }
    public int? Passengers { get; set; }
    public long? CargoCapacity { get; set; }

    public double? HyperdriveRating { get; set; }
    public int? MGLT { get; set; }

    public string? MaxAtmospheringSpeed { get; set; }
    public string? Consumables { get; set; }
}

public sealed class UpdateMyStarshipRequest
{
    public string Name { get; set; } = "";

    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }

    public decimal? CostInCredits { get; set; }
    public double? Length { get; set; }
    public int? Crew { get; set; }
    public int? Passengers { get; set; }
    public long? CargoCapacity { get; set; }

    public double? HyperdriveRating { get; set; }
    public int? MGLT { get; set; }

    public string? MaxAtmospheringSpeed { get; set; }
    public string? Consumables { get; set; }
}


public sealed class MyStarshipDetailDto : MyStarshipListItemDto
{
    public bool IsActive { get; set; }
}
