using System.Net.Http.Json;
using StarWarsApi.Server.Swapi.Dto;

namespace StarWarsApi.Server.Swapi;

public class SwapiClient
{
    private readonly HttpClient _http;

    public SwapiClient(HttpClient http)
    {
        _http = http;
        _http.BaseAddress ??= new Uri("https://swapi.dev/api/");
    }

    public async Task<List<T>> GetAllAsync<T>(string resourcePath, CancellationToken ct)
    {
        // resourcePath like "people", "planets", etc.
        var items = new List<T>();
        string? next = resourcePath.EndsWith("/") ? resourcePath : resourcePath + "/";

        while (next != null)
        {
            var page = await _http.GetFromJsonAsync<SwapiListResponse<T>>(next, ct)
                       ?? throw new InvalidOperationException($"SWAPI returned null for {next}");

            items.AddRange(page.Results);
            next = page.Next;

            // SWAPI returns absolute next URLs sometimes; convert to relative for BaseAddress requests
            if (next != null && next.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                next = new Uri(next).PathAndQuery.TrimStart('/'); // e.g. "api/people/?page=2"
                if (next.StartsWith("api/")) next = next["api/".Length..];
            }
        }

        return items;
    }
}
