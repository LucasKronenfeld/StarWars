using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Data;
using StarWarsApi.Server.Data.Seeding;
using StarWarsApi.Server.Swapi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using StarWarsApi.Server.Models;
using System.Text;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register SWAPI source based on environment
if (builder.Environment.EnvironmentName == "Testing" && 
    builder.Configuration.GetValue<bool>("Seed:UseLocalSnapshot", false))
{
    // Use snapshot source for deterministic testing
    builder.Services.AddScoped<ISwapiSource, SnapshotSwapiSource>();
}
else
{
    // Use HTTP client for production/development
    builder.Services.AddHttpClient<SwapiClient>();
    builder.Services.AddScoped<ISwapiSource, SwapiClient>();
}

builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StarWars API",
        Version = "v1"
    });

    // JWT Bearer auth support in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
            c.AddSecurityDefinition("SeedKey", new OpenApiSecurityScheme
    {
        Name = "X-SEED-KEY",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "Seeder API Key"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "SeedKey"
                }
            },
            Array.Empty<string>()
        }
    });

});



builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        // Optional policies:
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
    })
    .AddRoles<IdentityRole>()  // Enable roles
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
var jwtIssuer = jwtSection["Issuer"] ?? "StarWarsApi";
var jwtAudience = jwtSection["Audience"] ?? "StarWarsApi";
var corsPolicyName = "ClientCors";

// CORS: support both config-based and default localhost origins
var configuredOrigins = builder.Configuration.GetSection("CORS:Origins").Get<string[]>() 
    ?? Array.Empty<string>();
var defaultOrigins = new[] { "http://localhost:5173", "http://localhost:5174", "http://localhost:3000" };
var allowedOrigins = configuredOrigins.Length > 0 ? configuredOrigins : defaultOrigins;

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),

            // Map ClaimTypes.Role so [Authorize(Roles="Admin")] works
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();
var app = builder.Build();

// Apply migrations automatically (configurable for production)
if (builder.Configuration.GetValue<bool>("Database:AutoMigrate", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    logger.LogInformation("Applying pending database migrations...");
    await db.Database.MigrateAsync();
    logger.LogInformation("Database migrations applied successfully");
}

// Bootstrap Admin role and assign to configured emails
// One-time seeding if database is empty
if (builder.Configuration.GetValue<bool>("Seed:AutoBootstrap", true))
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        var result = await seeder.BootstrapAsync(CancellationToken.None);
        logger.LogInformation("Bootstrap seeding result: {@Result}", result);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Bootstrap seeding failed - application will continue but catalog may be empty");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors(corsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint for Docker and Azure
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .AllowAnonymous();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

// Make Program class accessible to WebApplicationFactory in test projects
public partial class Program { }
