using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Models;

namespace StarWarsApi.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Core entities
        public DbSet<Person> People => Set<Person>();
        public DbSet<Planet> Planets => Set<Planet>();
        public DbSet<Film> Films => Set<Film>();
        public DbSet<Starship> Starships => Set<Starship>();
        public DbSet<Vehicle> Vehicles => Set<Vehicle>();
        public DbSet<Species> Species => Set<Species>();
        public DbSet<Fleet> Fleets => Set<Fleet>();
        public DbSet<FleetStarship> FleetStarships => Set<FleetStarship>();
        // Join tables
        public DbSet<FilmCharacter> FilmCharacters => Set<FilmCharacter>();
        public DbSet<FilmPlanet> FilmPlanets => Set<FilmPlanet>();
        public DbSet<FilmStarship> FilmStarships => Set<FilmStarship>();
        public DbSet<FilmVehicle> FilmVehicles => Set<FilmVehicle>();
        public DbSet<FilmSpecies> FilmSpecies => Set<FilmSpecies>();


        public DbSet<StarshipPilot> StarshipPilots => Set<StarshipPilot>();
        public DbSet<VehiclePilot> VehiclePilots => Set<VehiclePilot>();

        public DbSet<PlanetResident> PlanetResidents => Set<PlanetResident>();
        public DbSet<SpeciesPerson> SpeciesPerson => Set<SpeciesPerson>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Starship>()
                .Property(s => s.CostInCredits)
                .HasPrecision(18, 0);

            modelBuilder.Entity<Person>()
                .HasOne(p => p.Homeworld)
                .WithMany(pl => pl.HomeworldPeople)
                .HasForeignKey(p => p.HomeworldId)
                .OnDelete(DeleteBehavior.SetNull);
            
           
            // ---- Starship ownership + catalog constraints ----
            modelBuilder.Entity<Starship>()
                .HasOne(s => s.OwnerUser)
                .WithMany()
                .HasForeignKey(s => s.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Starship>()
                .HasOne(s => s.BaseStarship)
                .WithMany()
                .HasForeignKey(s => s.BaseStarshipId)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Starship>()
                .HasOne(s => s.CustomPilot)
                .WithMany()
                .HasForeignKey(s => s.CustomPilotId)
                .OnDelete(DeleteBehavior.SetNull);

            // SwapiUrl should be unique when present (catalog rows) - legacy
            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.SwapiUrl)
                .IsUnique();

            // ---- Unified Data Source Identity (catalog entities) ----
            // Composite unique index (Source, SourceKey) for catalog entities
            // Prevents duplicates from SWAPI and extended JSON sources

            modelBuilder.Entity<Film>()
                .HasIndex(f => new { f.Source, f.SourceKey })
                .IsUnique();

            modelBuilder.Entity<Person>()
                .HasIndex(p => new { p.Source, p.SourceKey })
                .IsUnique();

            modelBuilder.Entity<Planet>()
                .HasIndex(p => new { p.Source, p.SourceKey })
                .IsUnique();

            modelBuilder.Entity<Species>()
                .HasIndex(s => new { s.Source, s.SourceKey })
                .IsUnique();

            modelBuilder.Entity<Starship>()
                .HasIndex(s => new { s.Source, s.SourceKey })
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => new { v.Source, v.SourceKey })
                .IsUnique();

             // ---- Starship indexes for catalog queries ----
            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.Name);

            modelBuilder.Entity<Starship>()
                 .HasIndex(s => s.Manufacturer);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.StarshipClass);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.CostInCredits);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.Length);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.Crew);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.Passengers);

            modelBuilder.Entity<Starship>()
                .HasIndex(s => s.CargoCapacity);

            // ---- Film joins ----
            modelBuilder.Entity<FilmCharacter>()
                .HasKey(fc => new { fc.FilmId, fc.PersonId });

            modelBuilder.Entity<FilmPlanet>()
                .HasKey(fp => new { fp.FilmId, fp.PlanetId });

            modelBuilder.Entity<FilmStarship>()
                .HasKey(fs => new { fs.FilmId, fs.StarshipId });

            modelBuilder.Entity<FilmVehicle>()
                .HasKey(fv => new { fv.FilmId, fv.VehicleId });

            modelBuilder.Entity<FilmSpecies>()
                .HasKey(fs => new { fs.FilmId, fs.SpeciesId });


            // ---- Pilot joins ----
            modelBuilder.Entity<StarshipPilot>()
                .HasKey(sp => new { sp.StarshipId, sp.PersonId });

            modelBuilder.Entity<VehiclePilot>()
                .HasKey(vp => new { vp.VehicleId, vp.PersonId });

            // ---- Residents ----
            modelBuilder.Entity<PlanetResident>()
                .HasKey(pr => new { pr.PlanetId, pr.PersonId });

            // ---- Species ----
            modelBuilder.Entity<SpeciesPerson>()
                .HasKey(ps => new { ps.PersonId, ps.SpeciesId });
            
            // ---- Fleets ----
            modelBuilder.Entity<Fleet>()
                .HasIndex(f => f.UserId)
                .IsUnique(); // one fleet per user

            modelBuilder.Entity<Fleet>()
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<FleetStarship>()
                .HasOne(fs => fs.Fleet)
                .WithMany(f => f.FleetStarships)
                .HasForeignKey(fs => fs.FleetId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<FleetStarship>()
                .HasOne(fs => fs.Starship)
                .WithMany()
                .HasForeignKey(fs => fs.StarshipId)
                .OnDelete(DeleteBehavior.Restrict);
            // Prevent duplicate rows for same ship within the same fleet
            modelBuilder.Entity<FleetStarship>()
                .HasIndex(fs => new { fs.FleetId, fs.StarshipId })
                .IsUnique();

        }
    }
}
