using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Person
    {
        public int Id { get; set; }

        // ---- Data Source Identity ----
        // "swapi" or "extended"
        [Required]
        public string Source { get; set; } = "swapi";

        // Stable unique key within Source (SWAPI url or JSON id)
        [Required]
        public string SourceKey { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        // Physical characteristics
        public int? Height { get; set; }     // cm
        public int? Mass { get; set; }       // kg

        public string? HairColor { get; set; }
        public string? SkinColor { get; set; }
        public string? EyeColor { get; set; }

        // Personal data
        public string? BirthYear { get; set; }  // e.g. "19BBY"
        public string? Gender { get; set; }

        // Relationships
        public int? HomeworldId { get; set; }
        public Planet? Homeworld { get; set; }


        public List<FilmCharacter> FilmCharacters { get; set; } = new();
        public List<VehiclePilot> VehiclePilots { get; set; } = new();
        public List<StarshipPilot> StarshipPilots { get; set; } = new();
        public List<PlanetResident> PlanetResidents { get; set; } = new();
        public List<SpeciesPerson> SpeciesPeople { get; set; } = new();
    }
}
