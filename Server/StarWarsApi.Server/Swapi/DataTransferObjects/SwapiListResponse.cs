namespace StarWarsApi.Server.Swapi.Dto;

public class SwapiListResponse<T>
{
    public int Count { get; set; }
    public string? Next { get; set; }
    public List<T> Results { get; set; } = new();
}
