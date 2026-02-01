using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using StarWarsApi.Server.Dtos;
using StarWarsApi.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace StarWarsApi.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        var user = new ApplicationUser
        {
            Email = email,
            UserName = email
        };

        var result = await _userManager.CreateAsync(user, req.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        var token = CreateJwt(user);
        return Ok(new AuthResponse { Token = token });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(email);

        if (user is null) return Unauthorized();

        var ok = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!ok) return Unauthorized();

        var token = CreateJwt(user);
        return Ok(new AuthResponse { Token = token });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        return Ok(new MeResponse
        {
            UserId = user.Id,
            Email = user.Email ?? ""
        });
    }

    private string CreateJwt(ApplicationUser user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt["Key"]!;
        var issuer = jwt["Issuer"]!;
        var audience = jwt["Audience"]!;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? user.UserName ?? "")
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
