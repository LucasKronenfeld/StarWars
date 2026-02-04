using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Dtos;
using Tests.Integration.Fixtures;

namespace Tests.Integration.Auth;

/// <summary>
/// Tests for authentication endpoints: registration, login, and token validation.
/// </summary>
[Collection(IntegrationTestCollection.Name)]
[Trait("Category", "Integration")]
[Trait("Category", "Auth")]
public class AuthTests : IntegrationTestBase
{
    public AuthTests(PostgresContainerFixture dbFixture) : base(dbFixture)
    {
    }

    #region Registration Tests

    [Fact]
    public async Task Register_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var email = CreateUniqueEmail("newuser");
        var password = "Password123!";

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Register_CreatesUserInDatabase()
    {
        // Arrange
        var email = CreateUniqueEmail("dbuser");
        var password = "Password123!";

        // Act
        await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        var userExists = await ExecuteDbContextAsync(async db =>
            await db.Users.AnyAsync(u => u.Email == email));

        userExists.Should().BeTrue("user should be created in database");
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var email = CreateUniqueEmail("duplicate");
        var password = "Password123!";

        // First registration
        await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Act - duplicate registration
        var response = await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ReturnsBadRequest()
    {
        // Arrange
        var email = CreateUniqueEmail("weakpwd");
        var password = "123"; // Too short (min 8 chars)

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var email = "not-an-email";
        var password = "Password123!";

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var email = CreateUniqueEmail("logintest");
        var password = "Password123!";

        await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        // Arrange
        var email = CreateUniqueEmail("wrongpwd");
        var password = "Password123!";

        await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "WrongPassword!"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ReturnsUnauthorized()
    {
        // Arrange
        var email = "nonexistent@test.com";
        var password = "Password123!";

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_EmailIsCaseInsensitive()
    {
        // Arrange
        var email = CreateUniqueEmail("casetest");
        var password = "Password123!";

        await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email.ToLower(),
            Password = password
        });

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email.ToUpper(),
            Password = password
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Token Validation Tests

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserInfo()
    {
        // Arrange
        var email = CreateUniqueEmail("metest");
        var password = "Password123!";

        var token = await AuthHelper.RegisterAsync(email, password);
        AuthHelper.AttachToken(token);

        // Act
        var response = await Client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var me = await response.Content.ReadFromJsonAsync<MeResponse>();
        me.Should().NotBeNull();
        me!.Email.Should().Be(email.ToLowerInvariant());
        me.UserId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        // Act
        var response = await Client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        AuthHelper.AttachToken("invalid-token-here");

        // Act
        var response = await Client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        // Act
        var response = await Client.GetAsync("/api/fleet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsSuccess()
    {
        // Arrange
        var email = CreateUniqueEmail("protected");
        var password = "Password123!";

        var token = await AuthHelper.RegisterAsync(email, password);
        AuthHelper.AttachToken(token);

        // Act
        var response = await Client.GetAsync("/api/fleet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Token Content Tests

    [Fact]
    public async Task Token_ContainsCorrectClaims()
    {
        // Arrange
        var email = CreateUniqueEmail("claims");
        var password = "Password123!";

        // Act
        var token = await AuthHelper.RegisterAsync(email, password);

        // Assert
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        jwtToken.Claims.Should().Contain(c => 
            c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
        jwtToken.Claims.Should().Contain(c => 
            c.Type == System.Security.Claims.ClaimTypes.Email && 
            c.Value == email.ToLowerInvariant());
    }

    #endregion
}
