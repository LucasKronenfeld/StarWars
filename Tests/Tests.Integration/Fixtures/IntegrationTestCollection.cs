namespace Tests.Integration.Fixtures;

/// <summary>
/// Defines a test collection that shares a PostgreSQL container.
/// All tests in this collection share the same database container instance.
/// </summary>
[CollectionDefinition(Name)]
public class IntegrationTestCollection : ICollectionFixture<PostgresContainerFixture>
{
    public const string Name = "Integration Tests";
}
