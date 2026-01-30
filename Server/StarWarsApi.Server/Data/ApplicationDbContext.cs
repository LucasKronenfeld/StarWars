using Microsoft.EntityFrameworkCore;
using StarWarsApi.Server.Models;

namespace StarWarsApi.Server.Data
{
    public class ApplicationDbContext : DbContext
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
        }
    }
}
