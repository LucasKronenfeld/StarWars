namespace Tests.Unit.ForkLogic;

/// <summary>
/// Unit tests for fork mapping logic.
/// Tests the property copying rules when forking a catalog ship.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Category", "ForkLogic")]
public class ForkMappingTests
{
    #region Test Data

    private static CatalogShipData CreateSampleCatalogShip() => new()
    {
        Id = 1,
        Name = "Millennium Falcon",
        Model = "YT-1300 light freighter",
        Manufacturer = "Corellian Engineering Corporation",
        StarshipClass = "Light freighter",
        CostInCredits = 100000m,
        Length = 34.75,
        Crew = 4,
        Passengers = 6,
        CargoCapacity = 100000,
        HyperdriveRating = 0.5,
        MGLT = 75,
        MaxAtmospheringSpeed = "1050",
        Consumables = "2 months",
        IsCatalog = true,
        IsActive = true,
        Source = "swapi",
        SourceKey = "https://swapi.dev/api/starships/10/",
        SwapiUrl = "https://swapi.dev/api/starships/10/"
    };

    #endregion

    #region Property Copying

    [Fact]
    public void Fork_CopiesAllEditableProperties()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();
        var userId = "user-123";

        // Act
        var fork = MapCatalogToFork(catalog, userId, customName: null);

        // Assert
        fork.Name.Should().Be(catalog.Name);
        fork.Model.Should().Be(catalog.Model);
        fork.Manufacturer.Should().Be(catalog.Manufacturer);
        fork.StarshipClass.Should().Be(catalog.StarshipClass);
        fork.CostInCredits.Should().Be(catalog.CostInCredits);
        fork.Length.Should().Be(catalog.Length);
        fork.Crew.Should().Be(catalog.Crew);
        fork.Passengers.Should().Be(catalog.Passengers);
        fork.CargoCapacity.Should().Be(catalog.CargoCapacity);
        fork.HyperdriveRating.Should().Be(catalog.HyperdriveRating);
        fork.MGLT.Should().Be(catalog.MGLT);
        fork.MaxAtmospheringSpeed.Should().Be(catalog.MaxAtmospheringSpeed);
        fork.Consumables.Should().Be(catalog.Consumables);
    }

    [Fact]
    public void Fork_SetsOwnershipProperties()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();
        var userId = "user-456";

        // Act
        var fork = MapCatalogToFork(catalog, userId, customName: null);

        // Assert
        fork.IsCatalog.Should().BeFalse("forked ship should not be catalog");
        fork.IsActive.Should().BeTrue("forked ship should be active");
        fork.OwnerUserId.Should().Be(userId);
        fork.BaseStarshipId.Should().Be(catalog.Id);
    }

    [Fact]
    public void Fork_ClearsSourceIdentity()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();

        // Act
        var fork = MapCatalogToFork(catalog, "user-789", customName: null);

        // Assert
        fork.Source.Should().BeNull("forked ship should not have source");
        fork.SourceKey.Should().BeNull("forked ship should not have source key");
        fork.SwapiUrl.Should().BeNull("forked ship should not have SWAPI URL");
    }

    [Fact]
    public void Fork_WithCustomName_UsesCustomName()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();
        var customName = "My Custom Falcon";

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName);

        // Assert
        fork.Name.Should().Be(customName);
    }

    [Fact]
    public void Fork_WithEmptyCustomName_UsesOriginalName()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName: "");

        // Assert
        fork.Name.Should().Be(catalog.Name);
    }

    [Fact]
    public void Fork_WithWhitespaceCustomName_UsesOriginalName()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName: "   ");

        // Assert
        fork.Name.Should().Be(catalog.Name);
    }

    [Fact]
    public void Fork_TrimsCustomName()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName: "  Trimmed Name  ");

        // Assert
        fork.Name.Should().Be("Trimmed Name");
    }

    #endregion

    #region Edge Cases

    [Fact]
    public void Fork_WithNullableFieldsNull_CopiesNulls()
    {
        // Arrange
        var catalog = new CatalogShipData
        {
            Id = 1,
            Name = "Basic Ship",
            Model = null,
            Manufacturer = null,
            CostInCredits = null,
            Length = null,
            IsCatalog = true,
            IsActive = true
        };

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName: null);

        // Assert
        fork.Model.Should().BeNull();
        fork.Manufacturer.Should().BeNull();
        fork.CostInCredits.Should().BeNull();
        fork.Length.Should().BeNull();
    }

    [Fact]
    public void Fork_PreservesNumericPrecision()
    {
        // Arrange
        var catalog = CreateSampleCatalogShip();
        catalog.CostInCredits = 123456789.12m;
        catalog.Length = 34.756789;
        catalog.HyperdriveRating = 0.123456789;

        // Act
        var fork = MapCatalogToFork(catalog, "user-123", customName: null);

        // Assert
        fork.CostInCredits.Should().Be(123456789.12m);
        fork.Length.Should().Be(34.756789);
        fork.HyperdriveRating.Should().Be(0.123456789);
    }

    #endregion

    #region Mapping Function (Mirrors Server Logic)

    /// <summary>
    /// Maps a catalog ship to a fork.
    /// Mirrors: StarshipsController.ForkCatalogStarship
    /// </summary>
    private static ForkedShipData MapCatalogToFork(CatalogShipData baseShip, string userId, string? customName)
    {
        return new ForkedShipData
        {
            // Ownership flags
            IsCatalog = false,
            IsActive = true,
            SwapiUrl = null,
            Source = null,
            SourceKey = null,

            OwnerUserId = userId,
            BaseStarshipId = baseShip.Id,

            // Copy fields
            Name = string.IsNullOrWhiteSpace(customName) ? baseShip.Name : customName.Trim(),
            Model = baseShip.Model,
            Manufacturer = baseShip.Manufacturer,
            StarshipClass = baseShip.StarshipClass,

            CostInCredits = baseShip.CostInCredits,
            Length = baseShip.Length,
            Crew = baseShip.Crew,
            Passengers = baseShip.Passengers,
            CargoCapacity = baseShip.CargoCapacity,

            HyperdriveRating = baseShip.HyperdriveRating,
            MGLT = baseShip.MGLT,

            MaxAtmospheringSpeed = baseShip.MaxAtmospheringSpeed,
            Consumables = baseShip.Consumables
        };
    }

    #endregion

    #region Test DTOs

    private class CatalogShipData
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
        public double? HyperdriveRating { get; set; }
        public int? MGLT { get; set; }
        public string? MaxAtmospheringSpeed { get; set; }
        public string? Consumables { get; set; }
        public bool IsCatalog { get; set; }
        public bool IsActive { get; set; }
        public string? Source { get; set; }
        public string? SourceKey { get; set; }
        public string? SwapiUrl { get; set; }
    }

    private class ForkedShipData
    {
        public bool IsCatalog { get; set; }
        public bool IsActive { get; set; }
        public string? SwapiUrl { get; set; }
        public string? Source { get; set; }
        public string? SourceKey { get; set; }
        public string OwnerUserId { get; set; } = "";
        public int BaseStarshipId { get; set; }
        public string Name { get; set; } = "";
        public string? Model { get; set; }
        public string? Manufacturer { get; set; }
        public string? StarshipClass { get; set; }
        public decimal? CostInCredits { get; set; }
        public double? Length { get; set; }
        public int? Crew { get; set; }
        public int? Passengers { get; set; }
        public long? CargoCapacity { get; set; }
        public double? HyperdriveRating { get; set; }
        public int? MGLT { get; set; }
        public string? MaxAtmospheringSpeed { get; set; }
        public string? Consumables { get; set; }
    }

    #endregion
}
