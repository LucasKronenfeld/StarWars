using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StarWarsApi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStarshipIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Starships_CargoCapacity",
                table: "Starships",
                column: "CargoCapacity");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_CostInCredits",
                table: "Starships",
                column: "CostInCredits");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Crew",
                table: "Starships",
                column: "Crew");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Length",
                table: "Starships",
                column: "Length");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Manufacturer",
                table: "Starships",
                column: "Manufacturer");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Name",
                table: "Starships",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Passengers",
                table: "Starships",
                column: "Passengers");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_StarshipClass",
                table: "Starships",
                column: "StarshipClass");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Starships_CargoCapacity",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_CostInCredits",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Crew",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Length",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Manufacturer",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Name",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Passengers",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_StarshipClass",
                table: "Starships");
        }
    }
}
