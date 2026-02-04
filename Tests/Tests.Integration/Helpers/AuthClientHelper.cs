using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using StarWarsApi.Server.Dtos;

namespace Tests.Integration.Helpers;

/// <summary>
/// Authentication helper for integration tests.
/// Registers users, logs in, and attaches JWT tokens to HttpClient.
/// </summary>
public class AuthClientHelper
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly string _baseUrl;

    public AuthClientHelper(HttpClient client, WebApplicationFactory<Program> factory, string baseUrl = "/api/auth")
    {
        _client = client;
        _factory = factory;
        _baseUrl = baseUrl;
    }

    /// <summary>
    /// Registers a new user and returns the JWT token.
    /// </summary>
    public async Task<string> RegisterAsync(string email, string password)
    {
        var request = new RegisterRequest { Email = email, Password = password };
        var response = await _client.PostAsJsonAsync($"{_baseUrl}/register", request);
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return auth?.Token ?? throw new InvalidOperationException("No token returned");
    }

    /// <summary>
    /// Logs in an existing user and returns the JWT token.
    /// </summary>
    public async Task<string> LoginAsync(string email, string password)
    {
        var request = new LoginRequest { Email = email, Password = password };
        var response = await _client.PostAsJsonAsync($"{_baseUrl}/login", request);
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return auth?.Token ?? throw new InvalidOperationException("No token returned");
    }

    /// <summary>
    /// Registers a user and returns an HttpClient with Bearer token attached.
    /// </summary>
    public async Task<HttpClient> RegisterAndGetAuthenticatedClientAsync(string email, string password)
    {
        var token = await RegisterAsync(email, password);
        return CreateAuthenticatedClient(token);
    }

    /// <summary>
    /// Logs in a user and returns an HttpClient with Bearer token attached.
    /// </summary>
    public async Task<HttpClient> LoginAndGetAuthenticatedClientAsync(string email, string password)
    {
        var token = await LoginAsync(email, password);
        return CreateAuthenticatedClient(token);
    }

    /// <summary>
    /// Creates a new HttpClient from the test factory with the specified Bearer token.
    /// This client properly routes through the test server.
    /// </summary>
    public HttpClient CreateAuthenticatedClient(string token)
    {
        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);
        return authenticatedClient;
    }

    /// <summary>
    /// Attaches a Bearer token to the existing client's default headers.
    /// </summary>
    public void AttachToken(string token)
    {
        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Clears authentication from the client.
    /// </summary>
    public void ClearAuth()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }
}

/// <summary>
/// Test user credentials holder.
/// </summary>
public record TestUser(string Email, string Password, string Token);
