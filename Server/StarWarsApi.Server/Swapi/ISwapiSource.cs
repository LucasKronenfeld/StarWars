using StarWarsApi.Server.Swapi.Dto;

namespace StarWarsApi.Server.Swapi;

/// <summary>
/// Abstraction for fetching SWAPI data from different sources.
/// Implementations include HTTP (production/dev) and snapshot (testing).
/// </summary>
public interface ISwapiSource
{
    /// <summary>
    /// Fetches all entities of a given type from the SWAPI source.
    /// </summary>
    /// <typeparam name="T">The DTO type to fetch (SwapiFilmDto, SwapiPersonDto, etc.)</typeparam>
    /// <param name="resourcePath">Resource path like "films", "people", "planets"</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>List of entities</returns>
    Task<List<T>> GetAllAsync<T>(string resourcePath, CancellationToken ct);
}
