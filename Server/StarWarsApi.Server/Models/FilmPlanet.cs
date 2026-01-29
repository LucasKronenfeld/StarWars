namespace StarWarsApi.Server.Models
{
    public class FilmPlanet
    {
        public int FilmId { get; set; }
        public Film Film { get; set; } = null!;

        public int PlanetId { get; set; }
        public Planet Planet { get; set; } = null!;
    }
}
