namespace StarWarsApi.Server.Dtos;

public sealed class PagedResponse<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required int TotalCount { get; init; }
}
