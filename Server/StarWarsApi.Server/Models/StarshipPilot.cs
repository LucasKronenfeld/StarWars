namespace StarWarsApi.Server.Models
{
    public class StarshipPilot
    {
        public int StarshipId { get; set; }
        public Starship Starship { get; set; } = null!;

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;
    }
}
