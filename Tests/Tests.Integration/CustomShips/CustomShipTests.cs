using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;
using Tests.Integration.Helpers;

namespace Tests.Integration.CustomShips;

/// <summary>
/// Tests for custom starship management: create, edit, delete, ownership.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "CustomShips")]
public class CustomShipTests : IntegrationTestBase
{
    public CustomShipTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region Create Custom Ship

    [Fact]
    public async Task CreateShip_WithValidData_ReturnsCreatedShip()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Custom Fighter",
            Model = "CF-1",
            Manufacturer = "Test Industries",
            StarshipClass = "Starfighter",
            CostInCredits = 50000,
            Length = 12.5,
            Crew = 1,
            Passengers = 0,
            CargoCapacity = 100
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var ship = await response.Content.ReadFromJsonAsync<MyStarshipDetailDto>();
        ship.Should().NotBeNull();
        ship!.Name.Should().Be("Custom Fighter");
        ship.Model.Should().Be("CF-1");
        ship.Manufacturer.Should().Be("Test Industries");
        ship.CostInCredits.Should().Be(50000);
    }

    [Fact]
    public async Task CreateShip_SetsCorrectFlags()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Flag Test Ship"
        });
        var ship = await response.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Assert in database
        var dbShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == ship!.Id));

        dbShip.Should().NotBeNull();
        dbShip!.IsCatalog.Should().BeFalse("custom ships should not be catalog");
        dbShip.IsActive.Should().BeTrue("new ships should be active");
        dbShip.OwnerUserId.Should().NotBeNullOrWhiteSpace("custom ship must have owner");
        dbShip.BaseStarshipId.Should().BeNull("brand new ships have no base");
        dbShip.Source.Should().BeNull("custom ships have no source");
        dbShip.SourceKey.Should().BeNull("custom ships have no source key");
    }

    [Fact]
    public async Task CreateShip_WithoutName_ReturnsBadRequest()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "",
            Model = "Test"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateShip_WithInvalidPilot_ReturnsBadRequest()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Test Ship",
            PilotId = 999999 // Non-existent pilot
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateShip_WithValidPilot_SetsPilot()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var pilotId = await GetFirstPersonId();

        // Act
        var response = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Piloted Ship",
            PilotId = pilotId
        });
        var ship = await response.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Assert
        ship!.PilotId.Should().Be(pilotId);
    }

    #endregion

    #region Read Custom Ships

    [Fact]
    public async Task GetMine_ReturnsOnlyOwnedShips()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("myships1"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("myships2"));

        // User 1 creates ships
        await user1Client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest { Name = "User1 Ship A" });
        await user1Client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest { Name = "User1 Ship B" });

        // User 2 creates ships
        await user2Client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest { Name = "User2 Ship" });

        // Act
        var user1Ships = await user1Client.GetFromJsonAsync<PagedResponse<MyStarshipListItemDto>>("/api/my-starships");
        var user2Ships = await user2Client.GetFromJsonAsync<PagedResponse<MyStarshipListItemDto>>("/api/my-starships");

        // Assert
        user1Ships!.Items.Should().HaveCount(2);
        user1Ships.Items.Should().AllSatisfy(s => s.Name.Should().StartWith("User1"));

        user2Ships!.Items.Should().HaveCount(1);
        user2Ships.Items.Single().Name.Should().Be("User2 Ship");
    }

    [Fact]
    public async Task GetById_OwnedShip_ReturnsShip()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Detail Test Ship",
            Model = "DT-1"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var response = await client.GetAsync($"/api/my-starships/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ship = await response.Content.ReadFromJsonAsync<MyStarshipDetailDto>();
        ship!.Name.Should().Be("Detail Test Ship");
        ship.Model.Should().Be("DT-1");
    }

    [Fact]
    public async Task GetById_OtherUsersShip_ReturnsNotFound()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("owner"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("intruder"));

        var createResponse = await user1Client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Private Ship"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var response = await user2Client.GetAsync($"/api/my-starships/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Update Custom Ship

    [Fact]
    public async Task UpdateShip_OwnedShip_Succeeds()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Original Name",
            Model = "Original"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var updateResponse = await client.PutAsJsonAsync($"/api/my-starships/{created!.Id}", new UpdateMyStarshipRequest
        {
            Name = "Updated Name",
            Model = "Updated",
            CostInCredits = 99999
        });

        // Assert
        updateResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var updated = await client.GetFromJsonAsync<MyStarshipDetailDto>($"/api/my-starships/{created.Id}");
        updated!.Name.Should().Be("Updated Name");
        updated.Model.Should().Be("Updated");
        updated.CostInCredits.Should().Be(99999);
    }

    [Fact]
    public async Task UpdateShip_OtherUsersShip_ReturnsNotFound()
    {
        // Arrange
        var ownerClient = await RegisterUserAsync(CreateUniqueEmail("updateowner"));
        var attackerClient = await RegisterUserAsync(CreateUniqueEmail("attacker"));

        var createResponse = await ownerClient.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Owner's Ship"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var response = await attackerClient.PutAsJsonAsync($"/api/my-starships/{created!.Id}", new UpdateMyStarshipRequest
        {
            Name = "Hacked Name"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Verify original unchanged
        var original = await ownerClient.GetFromJsonAsync<MyStarshipDetailDto>($"/api/my-starships/{created.Id}");
        original!.Name.Should().Be("Owner's Ship");
    }

    [Fact]
    public async Task UpdateShip_WithEmptyName_ReturnsBadRequest()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Valid Name"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var response = await client.PutAsJsonAsync($"/api/my-starships/{created!.Id}", new UpdateMyStarshipRequest
        {
            Name = ""
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Delete Custom Ship

    [Fact]
    public async Task DeleteShip_OwnedShip_SoftDeletes()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Delete Me"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var deleteResponse = await client.DeleteAsync($"/api/my-starships/{created!.Id}");

        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify soft deleted
        var dbShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == created.Id));

        dbShip.Should().NotBeNull("ship should still exist in database");
        dbShip!.IsActive.Should().BeFalse("ship should be soft deleted");
    }

    [Fact]
    public async Task DeleteShip_OtherUsersShip_ReturnsNotFound()
    {
        // Arrange
        var ownerClient = await RegisterUserAsync(CreateUniqueEmail("deleteowner"));
        var attackerClient = await RegisterUserAsync(CreateUniqueEmail("deleteattacker"));

        var createResponse = await ownerClient.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Protected Ship"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var response = await attackerClient.DeleteAsync($"/api/my-starships/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Verify still active
        var dbShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == created.Id));
        dbShip!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteShip_AlreadyDeleted_IsIdempotent()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Double Delete"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Delete first time
        await client.DeleteAsync($"/api/my-starships/{created!.Id}");

        // Act - delete again
        var response = await client.DeleteAsync($"/api/my-starships/{created.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetMine_DoesNotIncludeDeletedShips()
    {
        // Arrange
        var client = await RegisterUserAsync();
        
        await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest { Name = "Active Ship" });
        var deleteResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest { Name = "Deleted Ship" });
        var deletedShip = await deleteResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();
        await client.DeleteAsync($"/api/my-starships/{deletedShip!.Id}");

        // Act
        var ships = await client.GetFromJsonAsync<PagedResponse<MyStarshipListItemDto>>("/api/my-starships");

        // Assert
        ships!.Items.Should().HaveCount(1);
        ships.Items.Single().Name.Should().Be("Active Ship");
    }

    #endregion

    #region Custom Ship in Fleet

    [Fact]
    public async Task CustomShip_CanBeAddedToOwnersFleet()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Fleet Custom Ship"
        });
        var ship = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act
        var addResponse = await client.PostAsJsonAsync("/api/fleet/items", new AddFleetItemRequest
        {
            StarshipId = ship!.Id,
            Quantity = 2
        });

        // Assert
        addResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().ContainSingle()
            .Which.StarshipId.Should().Be(ship.Id);
    }

    #endregion

    #region Helper Methods

    private async Task<int> GetFirstPersonId()
    {
        return await ExecuteDbContextAsync(async db =>
            await db.People
                .Select(p => p.Id)
                .FirstAsync());
    }

    #endregion
}

/// <summary>
/// Placeholder for PagedResponse - should match server DTO.
/// </summary>
public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
