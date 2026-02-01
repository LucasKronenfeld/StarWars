using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models;

public class FleetStarship
{
    public int Id { get; set; }

    [Required]
    public int FleetId { get; set; }
    public Fleet Fleet { get; set; } = null!;

    [Required]
    public int StarshipId { get; set; }
    public Starship Starship { get; set; } = null!;

    public int Quantity { get; set; } = 1;

    public string? Nickname { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
