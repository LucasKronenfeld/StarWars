namespace StarWarsApi.Server.Dtos;

public sealed class ForkStarshipRequest
{
    // Optional: user can override name at fork time (nice UX)
    public string? Name { get; set; }

    // Optional: if true, add the forked ship to fleet immediately
    public bool AddToFleet { get; set; } = true;
}

public sealed class ForkStarshipResponse
{
    public int Id { get; set; }            // new user-owned ship id
    public int BaseStarshipId { get; set; }// catalog id it came from
}
