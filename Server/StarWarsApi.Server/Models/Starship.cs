using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Starship
    {
        public int Id { get; set; }

        // Core info
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

        // Relationships
        public List<FilmStarship> FilmStarships { get; set; } = new();
        public List<StarshipPilot> StarshipPilots { get; set; } = new();

    }
}
