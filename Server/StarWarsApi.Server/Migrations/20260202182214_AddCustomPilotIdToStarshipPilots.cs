using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StarWarsApi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomPilotIdToStarshipPilots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomPilotId",
                table: "Starships",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Starships_CustomPilotId",
                table: "Starships",
                column: "CustomPilotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Starships_People_CustomPilotId",
                table: "Starships",
                column: "CustomPilotId",
                principalTable: "People",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Starships_People_CustomPilotId",
                table: "Starships");

            migrationBuilder.DropIndex(
                name: "IX_Starships_CustomPilotId",
                table: "Starships");

            migrationBuilder.DropColumn(
                name: "CustomPilotId",
                table: "Starships");
        }
    }
}
