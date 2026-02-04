using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;
using Tests.Integration.Helpers;

namespace Tests.Integration.Fleet;

/// <summary>
/// Tests for fleet management: creation, adding ships, quantity management, and isolation.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "Fleet")]
public class FleetTests : IntegrationTestBase
{
    public FleetTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region Fleet Creation

    [Fact]
    public async Task GetFleet_ForNewUser_ReturnsEmptyFleet()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.GetAsync("/api/fleet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var fleet = await response.Content.ReadFromJsonAsync<FleetDto>();
        fleet.Should().NotBeNull();
        fleet!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task AddItem_CreatesFleetAutomatically()
    {
        // Arrange
        var client = await RegisterUserAsync();
        
        // Get a catalog starship
        var starshipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 1
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify fleet was created in database
        var hasFleet = await ExecuteDbContextAsync(async db =>
            await db.Fleets.AnyAsync());
        hasFleet.Should().BeTrue("fleet should be auto-created when adding item");
    }

    [Fact]
    public async Task User_HasExactlyOneFleet()
    {
        // Arrange
        var email = CreateUniqueEmail("onefleet");
        var client = await RegisterUserAsync(email);
        
        var starshipId = await GetFirstCatalogStarshipId();

        // Add multiple items
        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest { StarshipId = starshipId, Quantity = 1 });
        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest { StarshipId = starshipId, Quantity = 1 });

        // Act
        var userId = await GetUserIdByEmail(email);
        var fleetCount = await ExecuteDbContextAsync(async db =>
            await db.Fleets.CountAsync(f => f.UserId == userId));

        // Assert
        fleetCount.Should().Be(1, "user should have exactly one fleet");
    }

    #endregion

    #region Adding Ships

    [Fact]
    public async Task AddItem_CatalogShip_Succeeds()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 1
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().ContainSingle()
            .Which.StarshipId.Should().Be(starshipId);
    }

    [Fact]
    public async Task AddItem_SameShipTwice_IncrementsQuantity()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        // Add first
        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 2
        });

        // Act - add more
        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 3
        });

        // Assert
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().ContainSingle()
            .Which.Quantity.Should().Be(5, "quantities should be summed");
    }

    [Fact]
    public async Task AddItem_WithQuantityZeroOrLess_DefaultsToOne()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        // Act
        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 0
        });

        // Assert
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().ContainSingle()
            .Which.Quantity.Should().Be(1);
    }

    [Fact]
    public async Task AddItem_NonExistentStarship_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = 999999,
            Quantity = 1
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AddItem_OtherUsersCustomShip_ReturnsForbidden()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("user1"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("user2"));

        // User 1 creates a custom ship
        var createResponse = await user1Client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "User1's Ship"
        });
        var createdShip = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act - User 2 tries to add User 1's ship
        var response = await user2Client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = createdShip!.Id,
            Quantity = 1
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Removing Ships

    [Fact]
    public async Task RemoveItem_ExistingShip_Succeeds()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 3
        });

        // Act
        var response = await client.DeleteAsync($"/api/fleet/items/{starshipId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveItem_NonExistentItem_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        // Don't add the item first

        // Act
        var response = await client.DeleteAsync($"/api/fleet/items/{starshipId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Updating Items

    [Fact]
    public async Task UpdateItem_ChangesQuantityAndNickname()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 1
        });

        // Act
        var response = await client.PatchAsJsonAsync($"/api/fleet/items/{starshipId}", new UpdateFleetItemRequest
        {
            Quantity = 5,
            Nickname = "My Falcon"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        var item = fleet!.Items.Should().ContainSingle().Subject;
        item.Quantity.Should().Be(5);
        item.Nickname.Should().Be("My Falcon");
    }

    [Fact]
    public async Task UpdateItem_QuantityBelowOne_DefaultsToOne()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 5
        });

        // Act
        await client.PatchAsJsonAsync($"/api/fleet/items/{starshipId}", new UpdateFleetItemRequest
        {
            Quantity = 0
        });

        // Assert
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().ContainSingle()
            .Which.Quantity.Should().Be(1);
    }

    #endregion

    #region Fleet Isolation

    [Fact]
    public async Task Fleets_AreIsolatedBetweenUsers()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("isolate1"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("isolate2"));

        var starships = await GetTwoCatalogStarshipIds();

        // User 1 adds ship A
        await user1Client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starships.First,
            Quantity = 10
        });

        // User 2 adds ship B
        await user2Client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starships.Second,
            Quantity = 5
        });

        // Act
        var user1Fleet = await user1Client.GetFromJsonAsync<FleetDto>("/api/fleet");
        var user2Fleet = await user2Client.GetFromJsonAsync<FleetDto>("/api/fleet");

        // Assert
        user1Fleet!.Items.Should().ContainSingle()
            .Which.StarshipId.Should().Be(starships.First);
        user1Fleet.Items.Single().Quantity.Should().Be(10);

        user2Fleet!.Items.Should().ContainSingle()
            .Which.StarshipId.Should().Be(starships.Second);
        user2Fleet.Items.Single().Quantity.Should().Be(5);
    }

    [Fact]
    public async Task User_CannotAccessOtherUsersFleet()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("access1"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("access2"));

        var starshipId = await GetFirstCatalogStarshipId();

        // User 1 adds a ship
        await user1Client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 3
        });

        // Act - User 2 tries to remove User 1's fleet item
        var response = await user2Client.DeleteAsync($"/api/fleet/items/{starshipId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound, 
            "user 2 doesn't have this ship in their fleet");

        // User 1's fleet should be unaffected
        var user1Fleet = await user1Client.GetFromJsonAsync<FleetDto>("/api/fleet");
        user1Fleet!.Items.Should().ContainSingle()
            .Which.Quantity.Should().Be(3);
    }

    #endregion

    #region Fleet Item Display

    [Fact]
    public async Task FleetItem_ShowsCatalogFlag()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 1
        });

        // Act
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");

        // Assert
        var item = fleet!.Items.Should().ContainSingle().Subject;
        item.IsCatalog.Should().BeTrue("catalog ships should be marked as catalog");
    }

    [Fact]
    public async Task FleetItem_IncludesStarshipDetails()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var starshipId = await GetFirstCatalogStarshipId();

        await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = starshipId,
            Quantity = 1
        });

        // Act
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");

        // Assert
        var item = fleet!.Items.Should().ContainSingle().Subject;
        item.Name.Should().NotBeNullOrWhiteSpace();
        item.StarshipId.Should().Be(starshipId);
    }

    #endregion

    #region Helper Methods

    private async Task<int> GetFirstCatalogStarshipId()
    {
        return await ExecuteDbContextAsync(async db =>
            await db.Starships
                .Where(s => s.IsCatalog && s.IsActive)
                .Select(s => s.Id)
                .FirstAsync());
    }

    private async Task<(int First, int Second)> GetTwoCatalogStarshipIds()
    {
        var ids = await ExecuteDbContextAsync(async db =>
            await db.Starships
                .Where(s => s.IsCatalog && s.IsActive)
                .Select(s => s.Id)
                .Take(2)
                .ToListAsync());

        return (ids[0], ids[1]);
    }

    private async Task<string> GetUserIdByEmail(string email)
    {
        return await ExecuteDbContextAsync(async db =>
            await db.Users
                .Where(u => u.Email == email.ToLowerInvariant())
                .Select(u => u.Id)
                .FirstAsync());
    }

    #endregion
}
