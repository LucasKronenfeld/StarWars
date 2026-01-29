namespace StarWarsApi.Server.Models
{
    public class FilmCharacter
    {
        public int FilmId { get; set; }
        public Film Film { get; set; } = null!;

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;
    }
}
