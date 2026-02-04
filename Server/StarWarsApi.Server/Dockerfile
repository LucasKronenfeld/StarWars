# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY Server/StarWarsApi.Server/*.csproj ./Server/StarWarsApi.Server/
WORKDIR /src/Server/StarWarsApi.Server
RUN dotnet restore

# Copy source code
WORKDIR /src
COPY Server/StarWarsApi.Server/ ./Server/StarWarsApi.Server/

# Build and publish
WORKDIR /src/Server/StarWarsApi.Server
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published files
COPY --from=build /app/publish .

# Copy extended JSON data
COPY Server/StarWarsApi.Server/Data/Extended ./Data/Extended

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "StarWarsApi.Server.dll"]
