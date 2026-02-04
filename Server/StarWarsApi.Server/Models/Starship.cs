using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Starship
    {
        public int Id { get; set; }

        // ---- Catalog / ownership metadata ----

        // True = seeded SWAPI catalog row (read-only for normal users)
        public bool IsCatalog { get; set; } = true;

        // Soft-delete / hide from catalog lists (admin can toggle)
        public bool IsActive { get; set; } = true;

        // ---- Data Source Identity (catalog ships only) ----
        // "swapi" or "extended" for catalog; null for user ships
        public string? Source { get; set; }

        // Stable unique key within Source (SWAPI url or JSON id)
        // For catalog ships only; null for user ships
        public string? SourceKey { get; set; }

        // Legacy: Stable SWAPI identifier (kept for backward compatibility)
        // For SWAPI catalog ships: SourceKey = SwapiUrl
        // For extended ships: SourceKey = JSON id, SwapiUrl = null
        // For user ships: both null
        public string? SwapiUrl { get; set; }

        // User-owned ships only
        public string? OwnerUserId { get; set; }
        public ApplicationUser? OwnerUser { get; set; }

        // If user forked from a catalog ship, point back to it
        public int? BaseStarshipId { get; set; }
        public Starship? BaseStarship { get; set; }

        // ---- Core info ----
        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Model { get; set; }
        public string? Manufacturer { get; set; }
        public string? StarshipClass { get; set; }

        // Numeric (parsed from strings)
        public decimal? CostInCredits { get; set; }
        public double? Length { get; set; }
        public int? Crew { get; set; }
        public int? Passengers { get; set; }
        public long? CargoCapacity { get; set; }

        public double? HyperdriveRating { get; set; }
        public int? MGLT { get; set; }

        // Mixed / non-numeric SWAPI fields
        public string? MaxAtmospheringSpeed { get; set; }
        public string? Consumables { get; set; }

        // Custom ship single pilot (optional)
        public int? CustomPilotId { get; set; }
        public Person? CustomPilot { get; set; }

        // Relationships (catalog ships use these; user ships can too if you decide later)
        public List<FilmStarship> FilmStarships { get; set; } = new();
        public List<StarshipPilot> StarshipPilots { get; set; } = new();
    }
}
