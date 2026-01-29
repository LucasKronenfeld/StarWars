using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Film
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public int EpisodeId { get; set; }

        [DataType(DataType.MultilineText)]
        public string? OpeningCrawl { get; set; }

        public string? Director { get; set; }
        public string? Producer { get; set; }

        public DateTime? ReleaseDate { get; set; }

        // Relationships
        public List<FilmCharacter> FilmCharacters { get; set; } = new();
        public List<FilmPlanet> FilmPlanets { get; set; } = new();
        public List<FilmStarship> FilmStarships { get; set; } = new();
        public List<FilmVehicle> FilmVehicles { get; set; } = new();
        public List<FilmSpecies> FilmSpecies { get; set; } = new();
    }
}
