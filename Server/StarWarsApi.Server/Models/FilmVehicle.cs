namespace StarWarsApi.Server.Models
{
    public class FilmVehicle
    {
        public int FilmId { get; set; }
        public Film Film { get; set; } = null!;

        public int VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
    }
}
