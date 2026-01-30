namespace StarWarsApi.Server.Swapi.Dto;

public class SwapiPlanetDto
{
    public string? Name { get; set; }
    public string? Rotation_Period { get; set; }
    public string? Orbital_Period { get; set; }
    public string? Diameter { get; set; }
    public string? Climate { get; set; }
    public string? Gravity { get; set; }
    public string? Terrain { get; set; }
    public string? Surface_Water { get; set; }
    public string? Population { get; set; }

    public List<string> Residents { get; set; } = new();
    public List<string> Films { get; set; } = new();

    public string Url { get; set; } = "";
}
