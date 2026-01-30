namespace StarWarsApi.Server.Swapi.Dto;

public class SwapiStarshipDto
{
    public string? Name { get; set; }
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? Starship_Class { get; set; }
    public string? Cost_In_Credits { get; set; }
    public string? Length { get; set; }
    public string? Crew { get; set; }
    public string? Passengers { get; set; }
    public string? Cargo_Capacity { get; set; }
    public string? Consumables { get; set; }
    public string? Hyperdrive_Rating { get; set; }
    public string? MGLT { get; set; }
    public string? Max_Atmosphering_Speed { get; set; }

    public List<string> Pilots { get; set; } = new();
    public List<string> Films { get; set; } = new();

    public string Url { get; set; } = "";
}
