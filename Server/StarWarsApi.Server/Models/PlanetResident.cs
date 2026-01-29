namespace StarWarsApi.Server.Models
{
    public class PlanetResident
    {
        public int PlanetId { get; set; }
        public Planet Planet { get; set; } = null!;

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;
    }
}
