namespace StarWarsApi.Server.Dtos;

public class FilmDetailsDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int EpisodeId { get; set; }
    public string? OpeningCrawl { get; set; }
    public string? Director { get; set; }
    public string? Producer { get; set; }
    public DateTime? ReleaseDate { get; set; }

    public List<NamedItemDto> Characters { get; set; } = new();
    public List<NamedItemDto> Planets { get; set; } = new();
    public List<NamedItemDto> Starships { get; set; } = new();
    public List<NamedItemDto> Vehicles { get; set; } = new();
    public List<NamedItemDto> Species { get; set; } = new();
}

public class NamedItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}
