namespace StarWarsApi.Server.Dtos;

public sealed class RangeDto<T> where T : struct
{
    public T? Min { get; init; }
    public T? Max { get; init; }
}
