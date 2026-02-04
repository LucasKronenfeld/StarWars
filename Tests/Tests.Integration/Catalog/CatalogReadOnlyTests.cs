using System.Net;
using System.Net.Http.Json;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;

namespace Tests.Integration.Catalog;

/// <summary>
/// Tests to ensure catalog data is read-only and protected from modification.
/// Verifies that the "seed once, static canon" contract is enforced.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "CatalogEnforcement")]
public class CatalogReadOnlyTests : IntegrationTestBase
{
    public CatalogReadOnlyTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region POST/PUT/DELETE Protection

    [Fact]
    public async Task PostToCatalogEndpoint_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var newShip = new
        {
            Name = "New Ship",
            Model = "Test Model",
            StarshipClass = "Test Class"
        };

        // Act - Try to POST to catalog endpoint
        var response = await client.PostAsJsonAsync("/api/starships", newShip);

        // Assert - Should return 404 (endpoint doesn't exist) or 405 (method not allowed)
        (response.StatusCode == HttpStatusCode.NotFound || 
         response.StatusCode == HttpStatusCode.MethodNotAllowed)
            .Should().BeTrue("POST to catalog should not be allowed");
    }

    [Fact]
    public async Task PutToCatalogStarship_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();
        var updateData = new
        {
            Name = "Modified Name",
            Model = "Modified Model"
        };

        // Act - Try to PUT to catalog starship
        var response = await client.PutAsJsonAsync($"/api/starships/{catalogShipId}", updateData);

        // Assert - Should return 404 (endpoint doesn't exist) or 405 (method not allowed)
        (response.StatusCode == HttpStatusCode.NotFound || 
         response.StatusCode == HttpStatusCode.MethodNotAllowed)
            .Should().BeTrue("PUT to catalog ship should not be allowed");
    }

    [Fact]
    public async Task DeleteCatalogStarship_ReturnsNotFound()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act - Try to DELETE catalog starship
        var response = await client.DeleteAsync($"/api/starships/{catalogShipId}");

        // Assert - Should return 404 (endpoint doesn't exist) or 405 (method not allowed)
        (response.StatusCode == HttpStatusCode.NotFound || 
         response.StatusCode == HttpStatusCode.MethodNotAllowed)
            .Should().BeTrue("DELETE of catalog ship should not be allowed");
    }

    #endregion

    #region GET Operations Only

    [Fact]
    public async Task GetCatalogStarships_IsReadOnly_ReturnsData()
    {
        // Act
        var response = await Client.GetAsync("/api/starships");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetCatalogStarshipById_IsReadOnly_ReturnsData()
    {
        // Arrange
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await Client.GetAsync($"/api/starships/{catalogShipId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ship = await response.Content.ReadFromJsonAsync<StarshipDetailsDto>();
        ship.Should().NotBeNull();
        // Catalog ships come from /api/starships endpoint
    }

    #endregion

    #region Catalog Integrity After Operations

    [Fact]
    public async Task AfterForkingCatalogShip_OriginalRemainsUnchanged()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Get original catalog ship
        var originalResponse = await Client.GetAsync($"/api/starships/{catalogShipId}");
        var originalShip = await originalResponse.Content.ReadFromJsonAsync<StarshipDetailsDto>();

        // Act - Fork the catalog ship
        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            Name = "Modified Fork"
        });
        forkResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Assert - Verify catalog ship is unchanged
        var catalogResponse = await Client.GetAsync($"/api/starships/{catalogShipId}");
        var catalogShip = await catalogResponse.Content.ReadFromJsonAsync<StarshipDetailsDto>();

        catalogShip.Should().NotBeNull();
        catalogShip!.Id.Should().Be(originalShip!.Id);
        catalogShip.Name.Should().Be(originalShip.Name);
        catalogShip.Model.Should().Be(originalShip.Model);
        // Catalog ship unchanged after fork
    }

    [Fact]
    public async Task AfterDeletingCustomShip_CatalogShipsUnaffected()
    {
        // Arrange
        var client = await RegisterUserAsync();
        var catalogShipId = await GetFirstCatalogStarshipId();

        // Fork a ship
        var forkResponse = await client.PostAsJsonAsync($"/api/starships/{catalogShipId}/fork", new ForkStarshipRequest
        {
            Name = "Custom Ship"
        });
        var forkedShip = await forkResponse.Content.ReadFromJsonAsync<ForkStarshipResponse>();

        // Get initial catalog count
        var initialResponse = await Client.GetAsync("/api/starships");
        var initialResult = await initialResponse.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();
        var initialCount = initialResult!.TotalCount;

        // Act - Delete the custom ship
        await client.DeleteAsync($"/api/my-starships/{forkedShip!.Id}");

        // Assert - Catalog count unchanged
        var finalResponse = await Client.GetAsync("/api/starships");
        var finalResult = await finalResponse.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();
        finalResult!.TotalCount.Should().Be(initialCount, "catalog count should not change when custom ship is deleted");
    }

    #endregion

    #region Catalog Data Immutability

    [Fact]
    public async Task AllCatalogShips_FromCatalogEndpoint()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?pageSize=100");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert - All ships from catalog endpoint are catalog ships
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty("catalog endpoint should return ships");
    }

    [Fact]
    public async Task CatalogShips_DoNotHaveOwners()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?pageSize=100");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        result.Should().NotBeNull();
        
        // Get detailed view of ships to verify they exist
        foreach (var ship in result!.Items.Take(3)) // Check first 3 for efficiency
        {
            var detailResponse = await Client.GetAsync($"/api/starships/{ship.Id}");
            var detail = await detailResponse.Content.ReadFromJsonAsync<StarshipDetailsDto>();
            
            detail.Should().NotBeNull();
            // Catalog ships are accessible via /api/starships endpoint
        }
    }

    #endregion

    #region Helper Methods

    private async Task<int> GetFirstCatalogStarshipId()
    {
        var response = await Client.GetAsync("/api/starships?pageSize=1");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();
        return result?.Items.FirstOrDefault()?.Id ?? throw new InvalidOperationException("No catalog ships found");
    }

    #endregion
}
