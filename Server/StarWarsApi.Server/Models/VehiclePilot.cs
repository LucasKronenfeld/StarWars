namespace StarWarsApi.Server.Models
{
    public class VehiclePilot
    {
        public int VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;

        public int PersonId { get; set; }
        public Person Person { get; set; } = null!;
    }
}
