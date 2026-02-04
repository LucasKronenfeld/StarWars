namespace Tests.Unit.OwnershipLogic;

/// <summary>
/// Unit tests for ownership validation rules.
/// Tests authorization logic for custom ships and fleets.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Category", "OwnershipLogic")]
public class OwnershipValidationTests
{
    #region Custom Ship Ownership

    [Fact]
    public void CanEditShip_WhenOwner_ReturnsTrue()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = userId
        };

        // Act
        var canEdit = CanEditCustomShip(ship, userId);

        // Assert
        canEdit.Should().BeTrue();
    }

    [Fact]
    public void CanEditShip_WhenNotOwner_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = "owner-user"
        };

        // Act
        var canEdit = CanEditCustomShip(ship, "other-user");

        // Assert
        canEdit.Should().BeFalse();
    }

    [Fact]
    public void CanEditShip_WhenCatalog_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            IsActive = true,
            OwnerUserId = null // Catalog ships have no owner
        };

        // Act
        var canEdit = CanEditCustomShip(ship, "any-user");

        // Assert
        canEdit.Should().BeFalse("catalog ships cannot be edited");
    }

    [Fact]
    public void CanEditShip_WhenInactive_ReturnsFalse()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = false, // Soft-deleted
            OwnerUserId = userId
        };

        // Act
        var canEdit = CanEditCustomShip(ship, userId);

        // Assert
        canEdit.Should().BeFalse("inactive ships cannot be edited");
    }

    #endregion

    #region Fleet Item Authorization

    [Fact]
    public void CanAddToFleet_CatalogShip_ReturnsTrue()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            IsActive = true,
            OwnerUserId = null
        };

        // Act
        var canAdd = CanAddShipToFleet(ship, "any-user");

        // Assert
        canAdd.Should().BeTrue("anyone can add catalog ships to their fleet");
    }

    [Fact]
    public void CanAddToFleet_OwnedCustomShip_ReturnsTrue()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = userId
        };

        // Act
        var canAdd = CanAddShipToFleet(ship, userId);

        // Assert
        canAdd.Should().BeTrue("users can add their own custom ships");
    }

    [Fact]
    public void CanAddToFleet_OtherUsersCustomShip_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = "owner-user"
        };

        // Act
        var canAdd = CanAddShipToFleet(ship, "other-user");

        // Assert
        canAdd.Should().BeFalse("users cannot add other users' custom ships");
    }

    [Fact]
    public void CanAddToFleet_InactiveShip_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            IsActive = false, // Retired
            OwnerUserId = null
        };

        // Act
        var canAdd = CanAddShipToFleet(ship, "any-user");

        // Assert
        canAdd.Should().BeFalse("inactive ships cannot be added to fleet");
    }

    [Fact]
    public void CanAddToFleet_InactiveCustomShip_ReturnsFalse()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = false,
            OwnerUserId = userId
        };

        // Act
        var canAdd = CanAddShipToFleet(ship, userId);

        // Assert
        canAdd.Should().BeFalse("inactive custom ships cannot be added even by owner");
    }

    #endregion

    #region Ship Visibility

    [Fact]
    public void CanViewCatalogShip_Always_ReturnsTrue()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            IsActive = true,
            OwnerUserId = null
        };

        // Act
        var canView = CanViewShipInCatalog(ship);

        // Assert
        canView.Should().BeTrue();
    }

    [Fact]
    public void CanViewCatalogShip_WhenInactive_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            IsActive = false, // Retired
            OwnerUserId = null
        };

        // Act
        var canView = CanViewShipInCatalog(ship);

        // Assert
        canView.Should().BeFalse("retired catalog ships should not appear in browse");
    }

    [Fact]
    public void CanViewCustomShip_WhenOwner_ReturnsTrue()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = userId
        };

        // Act
        var canView = CanViewCustomShip(ship, userId);

        // Assert
        canView.Should().BeTrue();
    }

    [Fact]
    public void CanViewCustomShip_WhenNotOwner_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = false,
            IsActive = true,
            OwnerUserId = "owner-user"
        };

        // Act
        var canView = CanViewCustomShip(ship, "other-user");

        // Assert
        canView.Should().BeFalse("users cannot view other users' custom ships");
    }

    #endregion

    #region Delete Authorization

    [Fact]
    public void CanDeleteShip_WhenOwner_ReturnsTrue()
    {
        // Arrange
        var userId = "user-123";
        var ship = new ShipData
        {
            IsCatalog = false,
            OwnerUserId = userId
        };

        // Act
        var canDelete = CanDeleteCustomShip(ship, userId);

        // Assert
        canDelete.Should().BeTrue();
    }

    [Fact]
    public void CanDeleteShip_WhenCatalog_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = true,
            OwnerUserId = null
        };

        // Act
        var canDelete = CanDeleteCustomShip(ship, "any-user");

        // Assert
        canDelete.Should().BeFalse("catalog ships cannot be deleted by users");
    }

    [Fact]
    public void CanDeleteShip_WhenNotOwner_ReturnsFalse()
    {
        // Arrange
        var ship = new ShipData
        {
            IsCatalog = false,
            OwnerUserId = "owner-user"
        };

        // Act
        var canDelete = CanDeleteCustomShip(ship, "other-user");

        // Assert
        canDelete.Should().BeFalse();
    }

    #endregion

    #region Authorization Functions (Mirroring Server Logic)

    private static bool CanEditCustomShip(ShipData ship, string userId)
    {
        return !ship.IsCatalog 
            && ship.IsActive 
            && ship.OwnerUserId == userId;
    }

    private static bool CanAddShipToFleet(ShipData ship, string userId)
    {
        if (!ship.IsActive) return false;
        if (ship.IsCatalog) return true;
        return ship.OwnerUserId == userId;
    }

    private static bool CanViewShipInCatalog(ShipData ship)
    {
        return ship.IsCatalog && ship.IsActive;
    }

    private static bool CanViewCustomShip(ShipData ship, string userId)
    {
        return !ship.IsCatalog && ship.OwnerUserId == userId;
    }

    private static bool CanDeleteCustomShip(ShipData ship, string userId)
    {
        return !ship.IsCatalog && ship.OwnerUserId == userId;
    }

    #endregion

    #region Test DTO

    private class ShipData
    {
        public bool IsCatalog { get; set; }
        public bool IsActive { get; set; }
        public string? OwnerUserId { get; set; }
    }

    #endregion
}
