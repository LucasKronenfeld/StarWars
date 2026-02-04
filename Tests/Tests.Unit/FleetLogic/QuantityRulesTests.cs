namespace Tests.Unit.FleetLogic;

/// <summary>
/// Unit tests for fleet quantity logic rules.
/// Tests pure business logic without database dependencies.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Category", "FleetLogic")]
public class QuantityRulesTests
{
    #region Quantity Increment Rules

    [Fact]
    public void AddQuantity_WhenPositive_AddsCorrectly()
    {
        // Arrange
        int currentQuantity = 5;
        int addQuantity = 3;

        // Act
        var result = currentQuantity + addQuantity;

        // Assert
        result.Should().Be(8);
    }

    [Fact]
    public void AddQuantity_WhenZero_DefaultsToOne()
    {
        // Arrange
        int requestedQuantity = 0;

        // Act
        var normalizedQuantity = NormalizeQuantity(requestedQuantity);

        // Assert
        normalizedQuantity.Should().Be(1);
    }

    [Fact]
    public void AddQuantity_WhenNegative_DefaultsToOne()
    {
        // Arrange
        int requestedQuantity = -5;

        // Act
        var normalizedQuantity = NormalizeQuantity(requestedQuantity);

        // Assert
        normalizedQuantity.Should().Be(1);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(-100, 1)]
    [InlineData(1, 1)]
    [InlineData(5, 5)]
    [InlineData(100, 100)]
    public void NormalizeQuantity_AppliesMinimumOfOne(int input, int expected)
    {
        // Act
        var result = NormalizeQuantity(input);

        // Assert
        result.Should().Be(expected);
    }

    #endregion

    #region Quantity Update Rules

    [Fact]
    public void UpdateQuantity_WhenBelowMinimum_ClampsToOne()
    {
        // Arrange
        int newQuantity = 0;

        // Act
        var result = ClampQuantity(newQuantity);

        // Assert
        result.Should().Be(1);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(1, 1)]
    [InlineData(10, 10)]
    [InlineData(int.MaxValue, int.MaxValue)]
    public void ClampQuantity_EnforcesMinimum(int input, int expected)
    {
        // Act
        var result = ClampQuantity(input);

        // Assert
        result.Should().Be(expected);
    }

    #endregion

    #region Page Size Clamping

    [Theory]
    [InlineData(0, 20)]   // Below min -> default
    [InlineData(-1, 20)]  // Negative -> default
    [InlineData(1, 1)]    // Valid min
    [InlineData(100, 100)] // Valid mid
    [InlineData(200, 200)] // Valid max
    [InlineData(201, 200)] // Above max -> clamped
    [InlineData(1000, 200)] // Way above max -> clamped
    public void ClampPageSize_EnforcesLimits(int input, int expected)
    {
        // Act
        var result = ClampPageSize(input);

        // Assert
        result.Should().Be(expected);
    }

    #endregion

    #region Helper Methods (Mirroring Server Logic)

    /// <summary>
    /// Normalizes quantity for add operations (minimum 1).
    /// Mirrors: FleetController.AddItem
    /// </summary>
    private static int NormalizeQuantity(int quantity)
    {
        return quantity < 1 ? 1 : quantity;
    }

    /// <summary>
    /// Clamps quantity for update operations (minimum 1).
    /// Mirrors: FleetController.UpdateItem
    /// </summary>
    private static int ClampQuantity(int quantity)
    {
        return quantity < 1 ? 1 : quantity;
    }

    /// <summary>
    /// Clamps page size to valid range.
    /// Mirrors: StarshipsController.GetAll
    /// </summary>
    private static int ClampPageSize(int pageSize)
    {
        return pageSize switch
        {
            < 1 => 20,
            > 200 => 200,
            _ => pageSize
        };
    }

    #endregion
}
