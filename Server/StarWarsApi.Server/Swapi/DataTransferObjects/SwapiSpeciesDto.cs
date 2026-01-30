namespace StarWarsApi.Server.Swapi.Dto;

public class SwapiSpeciesDto
{
    public string? Name { get; set; }
    public string? Classification { get; set; }
    public string? Designation { get; set; }
    public string? Average_Height { get; set; }
    public string? Skin_Colors { get; set; }
    public string? Hair_Colors { get; set; }
    public string? Eye_Colors { get; set; }
    public string? Average_Lifespan { get; set; }
    public string? Language { get; set; }
    public string? Homeworld { get; set; }

    public List<string> People { get; set; } = new();
    public List<string> Films { get; set; } = new();

    public string Url { get; set; } = "";
}
