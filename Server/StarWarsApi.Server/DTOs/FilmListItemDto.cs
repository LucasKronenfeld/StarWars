namespace StarWarsApi.Server.Dtos;

public class FilmListItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int EpisodeId { get; set; }
    public DateTime? ReleaseDate { get; set; }
}
