using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Planet
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

        // Orbital data
        public int? RotationPeriod { get; set; }
        public int? OrbitalPeriod { get; set; }
        public int? Diameter { get; set; }

        // Environmental data
        public string? Climate { get; set; }
        public string? Gravity { get; set; }
        public string? Terrain { get; set; }

        // Population data
        public int? SurfaceWater { get; set; }
        public long? Population { get; set; }

        // Relationships
        public List<PlanetResident> PlanetResidents { get; set; } = new();
        public List<FilmPlanet> FilmPlanets { get; set; } = new();
        public List<Person> HomeworldPeople { get; set; } = new();


    }
}
