# SWAPI Snapshot Data

This directory contains pre-captured JSON snapshots of SWAPI data for deterministic testing.

## Purpose

- **Deterministic Tests**: Tests use the same data every time, making assertions predictable
- **Fast**: No HTTP calls to swapi.dev during tests
- **Offline**: Tests work without internet connection
- **Consistent**: Avoids flakiness from API changes or downtime

## Files

- `films.json` - 2 films (A New Hope, Empire Strikes Back)
- `people.json` - 2 people (Luke Skywalker, C-3PO)
- `planets.json` - 2 planets (Tatooine, Hoth)
- `species.json` - 2 species (Human, Droid)
- `starships.json` - 3 starships (CR90 corvette, Star Destroyer, X-wing)
- `vehicles.json` - 1 vehicle (Sand Crawler)

## Usage

The snapshot source is activated in testing environment when:
```json
{
  "ASPNETCORE_ENVIRONMENT": "Testing",
  "Seed:UseLocalSnapshot": true
}
```

## Maintenance

If SWAPI API changes or you need to update the snapshot:

1. Capture fresh data from SWAPI:
   ```bash
   curl https://swapi.dev/api/films/ > films.json
   curl https://swapi.dev/api/people/ > people.json
   # etc.
   ```

2. Or use the live API once and save the response:
   ```csharp
   var client = new SwapiClient(new HttpClient());
   var films = await client.GetAllAsync<SwapiFilmDto>("films", ct);
   var json = JsonSerializer.Serialize(films, new JsonSerializerOptions { WriteIndented = true });
   File.WriteAllText("films.json", json);
   ```

3. Commit the updated snapshots to source control

## Format

Each file is a JSON array of DTOs matching the SWAPI API response format:
- Property names use snake_case (e.g., `episode_id`, `birth_year`)
- URLs are fully qualified (e.g., `https://swapi.dev/api/people/1/`)
- Arrays can be empty but should not be null

## Known Counts

The current snapshot contains:
- 2 films
- 2 people
- 2 planets
- 2 species
- 3 starships
- 1 vehicle

Update test assertions if you change the snapshot data.
