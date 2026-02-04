using System.ComponentModel.DataAnnotations;

namespace StarWarsApi.Server.Models
{
    public class Vehicle
    {
        public int Id { get; set; }

        // ---- Data Source Identity ----
        // "swapi" or "extended"
        [Required]
        public string Source { get; set; } = "swapi";

        // Stable unique key within Source (SWAPI url or JSON id)
        [Required]
        public string SourceKey { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Model { get; set; }
        public string? Manufacturer { get; set; }
        public string? CostInCredits { get; set; }
        public string? Length { get; set; }
        public string? MaxAtmospheringSpeed { get; set; }
        public string? Crew { get; set; }
        public string? Passengers { get; set; }
        public string? CargoCapacity { get; set; }
        public string? Consumables { get; set; }
        public string? VehicleClass { get; set; }

        // Relationships
        public List<FilmVehicle> FilmVehicles { get; set; } = new();
        public List<VehiclePilot> VehiclePilots { get; set; } = new();

    }
}
