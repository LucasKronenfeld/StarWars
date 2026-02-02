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

builder.Services.AddHttpClient<SwapiClient>();
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

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174")
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

// Bootstrap Admin role and assign to configured emails
await BootstrapAdminRoleAsync(app);

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
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

// Admin role bootstrap: ensures "Admin" role exists and assigns configured emails to it
static async Task BootstrapAdminRoleAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    const string adminRole = "Admin";

    // Ensure Admin role exists
    if (!await roleManager.RoleExistsAsync(adminRole))
    {
        var result = await roleManager.CreateAsync(new IdentityRole(adminRole));
        if (result.Succeeded)
            logger.LogInformation("Created '{Role}' role.", adminRole);
        else
            logger.LogWarning("Failed to create '{Role}' role: {Errors}", adminRole, 
                string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    // Get admin emails from config (case-insensitive)
    var adminEmails = config.GetSection("Seed:AdminEmails").Get<string[]>() ?? Array.Empty<string>();

    foreach (var email in adminEmails)
    {
        if (string.IsNullOrWhiteSpace(email)) continue;

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(normalizedEmail);

        if (user is null)
        {
            logger.LogWarning("Admin email '{Email}' not found in database. User must register first.", normalizedEmail);
            continue;
        }

        if (!await userManager.IsInRoleAsync(user, adminRole))
        {
            var result = await userManager.AddToRoleAsync(user, adminRole);
            if (result.Succeeded)
                logger.LogInformation("Assigned '{Role}' role to user '{Email}'.", adminRole, normalizedEmail);
            else
                logger.LogWarning("Failed to assign '{Role}' to '{Email}': {Errors}", adminRole, normalizedEmail,
                    string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }
}
