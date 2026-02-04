using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StarWarsApi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddDataSourceIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Vehicles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Vehicles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Starships",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Starships",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Species",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Species",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Planets",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Planets",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "People",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "People",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Films",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "Films",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_Source_SourceKey",
                table: "Vehicles",
                columns: new[] { "Source", "SourceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Starships_Source_SourceKey",
                table: "Starships",
                columns: new[] { "Source", "SourceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Species_Source_SourceKey",
                table: "Species",
                columns: new[] { "Source", "SourceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Planets_Source_SourceKey",
                table: "Planets",
                columns: new[] { "Source", "SourceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_People_Source_SourceKey",
                table: "People",
                columns: new[] { "Source", "SourceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Films_Source_SourceKey",
                table: "Films",
                columns: new[] { "Source", "SourceKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_Source_SourceKey",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Starships_Source_SourceKey",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Species_Source_SourceKey",
                table: "Species");

            migrationBuilder.DropIndex(
                name: "IX_Planets_Source_SourceKey",
                table: "Planets");

            migrationBuilder.DropIndex(
                name: "IX_People_Source_SourceKey",
                table: "People");

            migrationBuilder.DropIndex(
                name: "IX_Films_Source_SourceKey",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Species");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Species");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Planets");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Planets");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "People");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "People");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "Films");
        }
    }
}
