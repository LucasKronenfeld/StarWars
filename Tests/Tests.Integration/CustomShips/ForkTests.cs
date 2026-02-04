using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;
using Tests.Integration.Helpers;

namespace Tests.Integration.CustomShips;

/// <summary>
/// Tests for forking catalog starships into custom ships.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "Fork")]
public class ForkTests : IntegrationTestBase
{
    public ForkTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region Fork Creation

    [Fact]
    public async Task Fork_CatalogShip_CreatesCustomCopy()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = false
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();
        fork.Should().NotBeNull();
        fork!.Id.Should().BeGreaterThan(0);
        fork.BaseStarshipId.Should().Be(catalogShipId);
    }

    [Fact]
    public async Task Fork_SetsCorrectOwnershipFlags()
    {
        // Arrange
        var email = CreateUniqueEmail("forkowner");
        var client = await RegisterUserAsync(email);
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert in database
        var dbShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == fork!.Id));

        dbShip.Should().NotBeNull();
        dbShip!.IsCatalog.Should().BeFalse("forked ship should not be catalog");
        dbShip.IsActive.Should().BeTrue("forked ship should be active");
        dbShip.OwnerUserId.Should().NotBeNullOrWhiteSpace("forked ship must have owner");
        dbShip.BaseStarshipId.Should().Be(catalogShipId, "forked ship should reference base");
        dbShip.SwapiUrl.Should().BeNull("forked ship should not have SWAPI URL");
    }

    [Fact]
    public async Task Fork_CopiesAllProperties()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Get original catalog ship details
        var originalShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == catalogShipId));

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert
        var forkedShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == fork!.Id));

        forkedShip!.Name.Should().Be(originalShip!.Name);
        forkedShip.Model.Should().Be(originalShip.Model);
        forkedShip.Manufacturer.Should().Be(originalShip.Manufacturer);
        forkedShip.StarshipClass.Should().Be(originalShip.StarshipClass);
        forkedShip.CostInCredits.Should().Be(originalShip.CostInCredits);
        forkedShip.Length.Should().Be(originalShip.Length);
        forkedShip.Crew.Should().Be(originalShip.Crew);
        forkedShip.Passengers.Should().Be(originalShip.Passengers);
        forkedShip.CargoCapacity.Should().Be(originalShip.CargoCapacity);
        forkedShip.HyperdriveRating.Should().Be(originalShip.HyperdriveRating);
        forkedShip.MGLT.Should().Be(originalShip.MGLT);
        forkedShip.Consumables.Should().Be(originalShip.Consumables);
    }

    [Fact]
    public async Task Fork_WithCustomName_UsesCustomName()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            Name = "My Custom Named Fork",
            AddToFleet = false
        });
        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert
        var forkedShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == fork!.Id));

        forkedShip!.Name.Should().Be("My Custom Named Fork");
    }

    [Fact]
    public async Task Fork_WithAddToFleet_AddsToFleet()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = true
        });
        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().Contain(i => i.StarshipId == fork!.Id);
    }

    [Fact]
    public async Task Fork_WithoutAddToFleet_DoesNotAddToFleet()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = false
        });
        var fork = await response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert
        var fleet = await client.GetFromJsonAsync<FleetDto>("/api/fleet");
        fleet!.Items.Should().NotContain(i => i.StarshipId == fork!.Id);
    }

    #endregion

    #region Fork Independence

    [Fact]
    public async Task Fork_EditsDoNotAffectCatalogShip()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Get original catalog ship
        var originalCatalogShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.AsNoTracking().FirstOrDefaultAsync(s => s.Id == catalogShipId));

        // Fork
        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = false
        });
        var fork = await forkResponse.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Act - Edit the fork
        await client.PutAsJsonAsync($"/api/my-starships/{fork!.Id}", new UpdateMyStarshipRequest
        {
            Name = "Completely Different Name",
            Model = "Modified Model",
            CostInCredits = 999999
        });

        // Assert - Catalog ship unchanged
        var catalogShipAfterEdit = await ExecuteDbContextAsync(async db =>
            await db.Starships.AsNoTracking().FirstOrDefaultAsync(s => s.Id == catalogShipId));

        catalogShipAfterEdit!.Name.Should().Be(originalCatalogShip!.Name);
        catalogShipAfterEdit.Model.Should().Be(originalCatalogShip.Model);
        catalogShipAfterEdit.CostInCredits.Should().Be(originalCatalogShip.CostInCredits);
    }

    [Fact]
    public async Task Fork_IsIndependentFromOtherForks()
    {
        // Arrange
        var user1Client = await RegisterUserAsync(CreateUniqueEmail("forkuser1"));
        var user2Client = await RegisterUserAsync(CreateUniqueEmail("forkuser2"));
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Both users fork the same catalog ship
        var fork1Response = await user1Client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork1 = await fork1Response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        var fork2Response = await user2Client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork2 = await fork2Response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // User 1 edits their fork
        await user1Client.PutAsJsonAsync($"/api/my-starships/{fork1!.Id}", new UpdateMyStarshipRequest
        {
            Name = "User1's Modified Fork"
        });

        // Act - Get User 2's fork
        var user2ForkDetails = await user2Client.GetFromJsonAsync<MyStarshipDetailDto>($"/api/my-starships/{fork2!.Id}");

        // Assert - User 2's fork should be unaffected
        user2ForkDetails!.Name.Should().NotBe("User1's Modified Fork");
    }

    [Fact]
    public async Task Fork_MaintainsBaseReference()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Fork and edit
        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork = await forkResponse.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        await client.PutAsJsonAsync($"/api/my-starships/{fork!.Id}", new UpdateMyStarshipRequest
        {
            Name = "Heavily Modified"
        });

        // Act
        var forkDetails = await client.GetFromJsonAsync<MyStarshipDetailDto>($"/api/my-starships/{fork.Id}");

        // Assert
        forkDetails!.BaseStarshipId.Should().Be(catalogShipId, "base reference should be maintained after edits");
    }

    #endregion

    #region Fork Edge Cases

    [Fact]
    public async Task Fork_NonExistentShip_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();

        // Act
        var response = await client.PostAsJsonAsync("/api/starships/999999/fork", new ForkStarshipRequest());

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Fork_RequiresAuthentication()
    {
        // Arrange
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act - No auth
        var response = await Client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Fork_SameShipTwice_ReturnsSameOrNewFork()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // First fork
        var fork1Response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = false
        });
        var fork1 = await fork1Response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Act - Fork again
        var fork2Response = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            AddToFleet = false
        });
        var fork2 = await fork2Response.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert - Based on implementation, could return same fork or create new one
        fork2Response.StatusCode.Should().Be(HttpStatusCode.OK);
        fork2!.BaseStarshipId.Should().Be(catalogShipId);
    }

    [Fact]
    public async Task Fork_AppearsInMyStarships()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork = await forkResponse.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Assert
        var myShips = await client.GetFromJsonAsync<PagedResponse<MyStarshipListItemDto>>("/api/my-starships");
        myShips!.Items.Should().Contain(s => s.Id == fork!.Id);
    }

    [Fact]
    public async Task Fork_CanBeDeletedIndependently()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest());
        var fork = await forkResponse.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Act
        var deleteResponse = await client.DeleteAsync($"/api/my-starships/{fork!.Id}");

        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Catalog ship still exists
        var catalogShip = await ExecuteDbContextAsync(async db =>
            await db.Starships.FirstOrDefaultAsync(s => s.Id == catalogShipId));
        catalogShip.Should().NotBeNull();
        catalogShip!.IsActive.Should().BeTrue();
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

    #endregion
}
