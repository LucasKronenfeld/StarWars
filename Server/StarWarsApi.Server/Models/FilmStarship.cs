namespace StarWarsApi.Server.Models
{
    public class FilmStarship
    {
        public int FilmId { get; set; }
        public Film Film { get; set; } = null!;

        public int StarshipId { get; set; }
        public Starship Starship { get; set; } = null!;
    }
}
