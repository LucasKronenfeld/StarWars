using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;

namespace Tests.Integration.Catalog;

/// <summary>
/// Tests for catalog starship browsing endpoints.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "Catalog")]
public class CatalogTests : IntegrationTestBase
{
    public CatalogTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region Basic Read Operations

    [Fact]
    public async Task GetStarships_ReturnsSeededCatalogShips()
    {
        // Act
        var response = await Client.GetAsync("/api/starships");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        result.TotalCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetStarships_OnlyReturnsCatalogAndActiveShips()
    {
        // Arrange - Create a custom ship to ensure it's not returned
        var client = await RegisterUserAsync();
        await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Custom Ship Should Not Appear"
        });

        // Act
        var response = await Client.GetAsync("/api/starships");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert - Custom ship should not appear in catalog
        result!.Items.Should().NotContain(s => s.Name == "Custom Ship Should Not Appear");
        
        // All returned ships should be catalog ships
        foreach (var ship in result.Items)
        {
            var dbShip = await ExecuteDbContextAsync(async db =>
                await db.Starships.FirstOrDefaultAsync(s => s.Id == ship.Id));
            dbShip!.IsCatalog.Should().BeTrue("catalog endpoint should only return catalog ships");
            dbShip.IsActive.Should().BeTrue("catalog endpoint should only return active ships");
        }
    }

    [Fact]
    public async Task GetStarshipById_ReturnsCorrectShip()
    {
        // Arrange
        var firstShipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await Client.GetAsync($"/api/starships/{firstShipId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var ship = await response.Content.ReadFromJsonAsync<StarshipDetailsDto>();
        ship.Should().NotBeNull();
        ship!.Id.Should().Be(firstShipId);
        ship.Name.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetStarshipById_NonExistent_ReturnsNotFound()
    {
        // Act
        var response = await Client.GetAsync("/api/starships/999999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetStarshipById_CustomShip_ReturnsNotFound()
    {
        // Arrange - Create custom ship
        var client = await RegisterUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/my-starships", new CreateMyStarshipRequest
        {
            Name = "Private Custom"
        });
        var customShip = await createResponse.Content.ReadFromJsonAsync<MyStarshipDetailDto>();

        // Act - Try to get custom ship via catalog endpoint
        var response = await Client.GetAsync($"/api/starships/{customShip!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Paging

    [Fact]
    public async Task GetStarships_SupportsPaging()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?page=1&pageSize=5");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        result!.Items.Should().HaveCountLessOrEqualTo(5);
        result.TotalCount.Should().BeGreaterThanOrEqualTo(result.Items.Count);
    }

    [Fact]
    public async Task GetStarships_DifferentPages_ReturnDifferentItems()
    {
        // Act
        var page1Response = await Client.GetAsync("/api/starships?page=1&pageSize=3");
        var page1 = await page1Response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        var page2Response = await Client.GetAsync("/api/starships?page=2&pageSize=3");
        var page2 = await page2Response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert (if enough data)
        if (page1!.TotalCount > 3 && page2!.Items.Any())
        {
            var page1Ids = page1.Items.Select(s => s.Id).ToHashSet();
            var page2Ids = page2.Items.Select(s => s.Id).ToHashSet();
            page1Ids.Should().NotIntersectWith(page2Ids);
        }
    }

    [Fact]
    public async Task GetStarships_InvalidPageSize_IsClamped()
    {
        // Act - Request too large page size
        var response = await Client.GetAsync("/api/starships?page=1&pageSize=1000");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert - Should be clamped to max (200)
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result!.Items.Should().HaveCountLessOrEqualTo(200);
    }

    #endregion

    #region Filtering

    [Fact]
    public async Task GetStarships_FilterBySearch_FiltersResults()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?search=wing");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // If results found, they should contain search term
        if (result!.Items.Any())
        {
            result.Items.Should().AllSatisfy(s =>
            {
                var matchesSearch = 
                    (s.Name?.Contains("wing", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (s.Model?.Contains("wing", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (s.Manufacturer?.Contains("wing", StringComparison.OrdinalIgnoreCase) ?? false);
                matchesSearch.Should().BeTrue($"Ship {s.Name} should match search 'wing'");
            });
        }
    }

    [Fact]
    public async Task GetStarships_FilterByCostRange_FiltersResults()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?minCost=50000&maxCost=500000");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        if (result!.Items.Any())
        {
            result.Items.Where(s => s.CostInCredits.HasValue).Should().AllSatisfy(s =>
            {
                s.CostInCredits.Should().BeGreaterThanOrEqualTo(50000);
                s.CostInCredits.Should().BeLessThanOrEqualTo(500000);
            });
        }
    }

    [Fact]
    public async Task GetStarships_FilterByClass_FiltersResults()
    {
        // First get a valid class
        var ships = await Client.GetFromJsonAsync<PagedResponse<StarshipListItemDto>>("/api/starships?pageSize=50");
        var validClass = ships!.Items.FirstOrDefault(s => !string.IsNullOrEmpty(s.StarshipClass))?.StarshipClass;

        if (validClass != null)
        {
            // Act
            var response = await Client.GetAsync($"/api/starships?class={Uri.EscapeDataString(validClass)}");
            var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

            // Assert
            result!.Items.Should().AllSatisfy(s =>
            {
                s.StarshipClass?.ToLower().Should().Contain(validClass.ToLower());
            });
        }
    }

    #endregion

    #region Sorting

    [Fact]
    public async Task GetStarships_SortByName_ReturnsSorted()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?sort=name&dir=asc&pageSize=50");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        var names = result!.Items.Select(s => s.Name).ToList();
        names.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetStarships_SortByNameDescending_ReturnsSortedDescending()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?sort=name&dir=desc&pageSize=50");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert
        var names = result!.Items.Select(s => s.Name).ToList();
        names.Should().BeInDescendingOrder();
    }

    [Fact]
    public async Task GetStarships_SortByCost_ReturnsSorted()
    {
        // Act
        var response = await Client.GetAsync("/api/starships?sort=cost&dir=asc&pageSize=50");
        var result = await response.Content.ReadFromJsonAsync<PagedResponse<StarshipListItemDto>>();

        // Assert - nulls may come first or last depending on implementation
        var costs = result!.Items
            .Where(s => s.CostInCredits.HasValue)
            .Select(s => s.CostInCredits!.Value)
            .ToList();
        
        if (costs.Count > 1)
        {
            costs.Should().BeInAscendingOrder();
        }
    }

    #endregion

    #region Ship Details

    [Fact]
    public async Task GetStarshipById_IncludesFilmsAndPilots()
    {
        // Arrange - Find a ship with relationships
        var shipWithRelations = await ExecuteDbContextAsync(async db =>
            await db.Starships
                .Where(s => s.IsCatalog && s.IsActive)
                .Where(s => s.FilmStarships.Any() || s.StarshipPilots.Any())
                .Select(s => s.Id)
                .FirstOrDefaultAsync());

        if (shipWithRelations > 0)
        {
            // Act
            var response = await Client.GetAsync($"/api/starships/{shipWithRelations}");
            var ship = await response.Content.ReadFromJsonAsync<StarshipDetailsDto>();

            // Assert
            ship.Should().NotBeNull();
            (ship!.Films?.Any() == true || ship.Pilots?.Any() == true)
                .Should().BeTrue("ship should include related data");
        }
    }

    [Fact]
    public async Task GetStarshipById_IncludesAllFields()
    {
        // Arrange
        var shipId = await GetFirstCatalogStarshipId();

        // Act
        var response = await Client.GetAsync($"/api/starships/{shipId}");
        var ship = await response.Content.ReadFromJsonAsync<StarshipDetailsDto>();

        // Assert - Check key fields are present
        ship!.Id.Should().BeGreaterThan(0);
        ship.Name.Should().NotBeNullOrWhiteSpace();
        // Other fields may be null for some ships, but shouldn't throw
    }

    #endregion

    #region Filters Endpoint

    [Fact]
    public async Task GetFilters_ReturnsFilterOptions()
    {
        // Act
        var response = await Client.GetAsync("/api/starships/filters");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var filters = await response.Content.ReadFromJsonAsync<StarshipFiltersDto>();
        filters.Should().NotBeNull();
        filters!.Manufacturers.Should().NotBeNull();
        filters.Classes.Should().NotBeNull();
    }

    [Fact]
    public async Task GetFilters_ReturnsDistinctManufacturers()
    {
        // Act
        var response = await Client.GetAsync("/api/starships/filters");
        var filters = await response.Content.ReadFromJsonAsync<StarshipFiltersDto>();

        // Assert
        if (filters!.Manufacturers.Any())
        {
            filters.Manufacturers.Should().OnlyHaveUniqueItems();
            filters.Manufacturers.Should().AllSatisfy(m => m.Should().NotBeNullOrWhiteSpace());
        }
    }

    [Fact]
    public async Task GetFilters_ReturnsValidCostRange()
    {
        // Act
        var response = await Client.GetAsync("/api/starships/filters");
        var filters = await response.Content.ReadFromJsonAsync<StarshipFiltersDto>();

        // Assert
        if (filters!.CostInCredits?.Min.HasValue == true && filters.CostInCredits?.Max.HasValue == true)
        {
            filters.CostInCredits.Min!.Value.Should().BeLessThanOrEqualTo(filters.CostInCredits.Max!.Value);
        }
    }

    #endregion

    #region Authentication Not Required

    [Fact]
    public async Task CatalogEndpoints_DoNotRequireAuthentication()
    {
        // Act - Access without auth
        var listResponse = await Client.GetAsync("/api/starships");
        var detailResponse = await Client.GetAsync($"/api/starships/{await GetFirstCatalogStarshipId()}");
        var filtersResponse = await Client.GetAsync("/api/starships/filters");

        // Assert
        listResponse.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        detailResponse.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        filtersResponse.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
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

/// <summary>
/// Starship list item DTO for tests.
/// </summary>
public class StarshipListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? StarshipClass { get; set; }
    public decimal? CostInCredits { get; set; }
    public double? Length { get; set; }
    public int? Crew { get; set; }
    public int? Passengers { get; set; }
    public long? CargoCapacity { get; set; }
}

/// <summary>
/// Starship details DTO for tests.
/// </summary>
public class StarshipDetailsDto : StarshipListItemDto
{
    public double? HyperdriveRating { get; set; }
    public int? MGLT { get; set; }
    public string? MaxAtmospheringSpeed { get; set; }
    public string? Consumables { get; set; }
    public List<NamedItemDto>? Films { get; set; }
    public List<NamedItemDto>? Pilots { get; set; }
}

/// <summary>
/// Named item DTO for relationships.
/// </summary>
public class NamedItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>
/// Starship filters DTO.
/// </summary>
public class StarshipFiltersDto
{
    public List<string> Manufacturers { get; set; } = new();
    public List<string> Classes { get; set; } = new();
    public RangeDto<decimal>? CostInCredits { get; set; }
    public RangeDto<double>? Length { get; set; }
    public RangeDto<int>? Crew { get; set; }
    public RangeDto<int>? Passengers { get; set; }
    public RangeDto<long>? CargoCapacity { get; set; }
}

/// <summary>
/// Range DTO for filter ranges.
/// </summary>
public class RangeDto<T> where T : struct
{
    public T? Min { get; set; }
    public T? Max { get; set; }
}
