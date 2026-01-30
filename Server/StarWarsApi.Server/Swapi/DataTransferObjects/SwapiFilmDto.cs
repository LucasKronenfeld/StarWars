namespace StarWarsApi.Server.Swapi.Dto;

public class SwapiFilmDto
{
    public string? Title { get; set; }
    public int Episode_Id { get; set; }
    public string? Opening_Crawl { get; set; }
    public string? Director { get; set; }
    public string? Producer { get; set; }
    public string? Release_Date { get; set; }

    public List<string> Characters { get; set; } = new();
    public List<string> Planets { get; set; } = new();
    public List<string> Starships { get; set; } = new();
    public List<string> Vehicles { get; set; } = new();
    public List<string> Species { get; set; } = new();

    public string Url { get; set; } = "";
}
