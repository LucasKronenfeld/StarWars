namespace StarWarsApi.Server.Dtos;

public sealed class RegisterRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public sealed class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public sealed class AuthResponse
{
    public string Token { get; set; } = "";
}

public sealed class MeResponse
{
    public string UserId { get; set; } = "";
    public string Email { get; set; } = "";
}
