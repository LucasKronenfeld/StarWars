using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace StarWarsApi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFleet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BaseStarshipId",
                table: "Starships",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Starships",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCatalog",
                table: "Starships",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OwnerUserId",
                table: "Starships",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SwapiUrl",
                table: "Starships",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Fleets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fleets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fleets_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FleetStarships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FleetId = table.Column<int>(type: "integer", nullable: false),
                    StarshipId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Nickname = table.Column<string>(type: "text", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FleetStarships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FleetStarships_Fleets_FleetId",
                        column: x => x.FleetId,
                        principalTable: "Fleets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FleetStarships_Starships_StarshipId",
                        column: x => x.StarshipId,
                        principalTable: "Starships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Starships_BaseStarshipId",
                table: "Starships",
                column: "BaseStarshipId");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_OwnerUserId",
                table: "Starships",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Starships_SwapiUrl",
                table: "Starships",
                column: "SwapiUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Fleets_UserId",
                table: "Fleets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FleetStarships_FleetId_StarshipId",
                table: "FleetStarships",
                columns: new[] { "FleetId", "StarshipId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FleetStarships_StarshipId",
                table: "FleetStarships",
                column: "StarshipId");

            migrationBuilder.AddForeignKey(
                name: "FK_Starships_AspNetUsers_OwnerUserId",
                table: "Starships",
                column: "OwnerUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Starships_Starships_BaseStarshipId",
                table: "Starships",
                column: "BaseStarshipId",
                principalTable: "Starships",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Starships_AspNetUsers_OwnerUserId",
                table: "Starships");

            migrationBuilder.DropForeignKey(
                name: "FK_Starships_Starships_BaseStarshipId",
                table: "Starships");

            migrationBuilder.DropTable(
                name: "FleetStarships");

            migrationBuilder.DropTable(
                name: "Fleets");

            migrationBuilder.DropIndex(
                name: "IX_Starships_BaseStarshipId",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_OwnerUserId",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_SwapiUrl",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "BaseStarshipId",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "IsCatalog",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "SwapiUrl",
                table: "Starships");
        }
    }
}
