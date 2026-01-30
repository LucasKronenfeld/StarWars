using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StarWarsApi.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonHomeworld : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HomeworldUrl",
                table: "People");

            migrationBuilder.AddColumn<int>(
                name: "HomeworldId",
                table: "People",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_People_HomeworldId",
                table: "People",
                column: "HomeworldId");

            migrationBuilder.AddForeignKey(
                name: "FK_People_Planets_HomeworldId",
                table: "People",
                column: "HomeworldId",
                principalTable: "Planets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_People_Planets_HomeworldId",
                table: "People");

            migrationBuilder.DropIndex(
                name: "IX_People_HomeworldId",
                table: "People");

            migrationBuilder.DropColumn(
                name: "HomeworldId",
                table: "People");

            migrationBuilder.AddColumn<string>(
                name: "HomeworldUrl",
                table: "People",
                type: "text",
                nullable: true);
        }
    }
}
