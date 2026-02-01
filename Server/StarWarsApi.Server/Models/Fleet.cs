using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models;

public class Fleet
{
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<FleetStarship> FleetStarships { get; set; } = new();
}
