using System.Text.Json;
using StarWarsApi.Server.Swapi.Dto;

namespace StarWarsApi.Server.Swapi;

/// <summary>
/// Snapshot-based SWAPI source for deterministic testing.
/// Loads data from pre-captured JSON files instead of hitting the live API.
/// </summary>
public class SnapshotSwapiSource : ISwapiSource
{
    private readonly string _snapshotBasePath;
    private readonly ILogger<SnapshotSwapiSource> _logger;

    public SnapshotSwapiSource(IConfiguration config, ILogger<SnapshotSwapiSource> logger)
    {
        _snapshotBasePath = config["Seed:SnapshotPath"] ?? "Data/Seeding/SwapiSnapshot";
        _logger = logger;
    }

    public async Task<List<T>> GetAllAsync<T>(string resourcePath, CancellationToken ct)
    {
        // Normalize path: "people/" -> "people"
        var normalizedPath = resourcePath.TrimEnd('/');
        var snapshotFile = Path.Combine(_snapshotBasePath, $"{normalizedPath}.json");

        if (!File.Exists(snapshotFile))
        {
            _logger.LogError("Snapshot file not found: {SnapshotFile}", snapshotFile);
            throw new FileNotFoundException($"Snapshot file not found: {snapshotFile}");
        }

        _logger.LogInformation("Loading SWAPI data from snapshot: {SnapshotFile}", snapshotFile);

        var json = await File.ReadAllTextAsync(snapshotFile, ct);
        var items = JsonSerializer.Deserialize<List<T>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (items == null)
        {
            _logger.LogError("Failed to deserialize snapshot file: {SnapshotFile}", snapshotFile);
            throw new InvalidOperationException($"Failed to deserialize snapshot file: {snapshotFile}");
        }

        _logger.LogInformation("Loaded {Count} {Type} records from snapshot", items.Count, typeof(T).Name);
        return items;
    }
}
