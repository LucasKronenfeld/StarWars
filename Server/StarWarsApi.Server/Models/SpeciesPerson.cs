namespace StarWarsApi.Server.Models
{
    public class SpeciesPerson
    {
        public int SpeciesId { get; set; }
        public Species Species { get; set; } = null!;

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;
    }
}
