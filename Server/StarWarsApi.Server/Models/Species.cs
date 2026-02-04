using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Species
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

        public string? Classification { get; set; }
        public string? Designation { get; set; }
        public string? AverageHeight { get; set; }
        public string? SkinColors { get; set; }
        public string? HairColors { get; set; }
        public string? EyeColors { get; set; }
        public string? AverageLifespan { get; set; }
        public string? Language { get; set; }

        // Optional homeworld
        public int? HomeworldId { get; set; }
        public Planet? Homeworld { get; set; }

        public List<SpeciesPerson> SpeciesPeople { get; set; } = new();
        public List<FilmSpecies> FilmSpecies { get; set; } = new();
    }
}
