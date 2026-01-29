namespace StarWarsApi.Server.Models
{
    public class FilmSpecies
    {
        public int FilmId { get; set; }
        public Film Film { get; set; } = null!;

        public int SpeciesId { get; set; }
        public Species Species { get; set; } = null!;
    }
}
