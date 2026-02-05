# Star Wars Fleet Platform

A full-stack Star Wars starship management application built with .NET 8 and React. Browse the galactic catalog, build your own custom ships, and assemble your ultimate fleet!

![.NET 8](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

---

## ✨ Features

### Core Functionality
- **Starship Catalog** - Browse all starships from the Star Wars universe with sorting, filtering, and pagination
- **Full CRUD Operations** - Create, read, update, and delete custom starships
- **Fleet Management** - Build and manage your personal fleet of starships
- **Ship Builder** - Interactive wizard to design custom ships with stat visualization
- **Ship Forking** - Clone catalog ships as a starting point for customization

### Additional Content
- **Films** - Browse all Star Wars films with opening crawl animations
- **People** - Explore characters from the Star Wars universe
- **Planets** - Discover planets across the galaxy
- **Species** - Learn about different species
- **Vehicles** - Browse ground and atmospheric vehicles

### Technical Features
- **JWT Authentication** - Secure user registration and login
- **Responsive Design** - Mobile-friendly Star Wars-themed UI with glass morphism
- **Real-time Validation** - Form validation with toast notifications

---

## 🛠️ Tech Stack

### Backend
- **.NET 8** with ASP.NET Core Web API
- **Entity Framework Core 8** with SQL Server / PostgreSQL
- **ASP.NET Core Identity** for authentication
- **JWT Bearer** tokens for API authorization
- **Swagger/OpenAPI** documentation

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching and caching
- **React Router** for navigation

### Infrastructure
- **Docker & Docker Compose** for containerization
- **PostgreSQL** (Docker) / SQL Server (local) database support

---

## 🚀 Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (optional, for containerized setup)
- SQL Server LocalDB or PostgreSQL

### Option 1: Local Development (Recommended for Development)

#### 1. Start the Backend

```bash
cd Server/StarWarsApi.Server

# Update connection string in appsettings.Development.json if needed

# Run migrations and start
dotnet ef database update
dotnet run
```

The API will be available at:
- **HTTP**: `http://localhost:5058`
- **HTTPS**: `https://localhost:7077`

#### 2. Start the Frontend

```bash
cd Client

# Install dependencies
npm install

# Start development server
npm run dev
```

The client will be available at `http://localhost:5173`.

### Option 2: Docker (Containerized)

```bash
# Clone the repository
git clone https://github.com/yourusername/StarWars.git
cd StarWars

# Start all services
docker-compose up --build

# Access the application
# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger
# Frontend: http://localhost:3000

# The frontend is served by nginx in the frontend container.

### When to use docker-compose.dev.yml
Use the dev compose if you want a Development API environment (Swagger enabled, dev wipe endpoint). It now also includes the frontend.
```

See [DOCKER_README.md](DOCKER_README.md) for detailed Docker configuration.

---

## 📁 Project Structure

```
StarWars/
├── Client/                      # React frontend
│   ├── src/
│   │   ├── api/                 # API client modules
│   │   ├── auth/                # Authentication context
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React contexts
│   │   └── pages/               # Page components
│   └── public/                  # Static assets
│
├── Server/
│   └── StarWarsApi.Server/      # .NET 8 Web API
│       ├── Controllers/         # API endpoints
│       ├── Data/                # EF Core context & seeding
│       ├── DTOs/                # Data transfer objects
│       ├── Models/              # Entity models
│       ├── Migrations/          # EF Core migrations
│       └── Swapi/               # SWAPI integration
│
├── Tests/
│   ├── Tests.Unit/              # Unit tests (47 tests)
│   └── Tests.Integration/       # Integration tests (93+ tests)
│
├── docker-compose.yml           # Production Docker config
├── docker-compose.dev.yml       # Development Docker config
└── StarWars.sln                 # Solution file
```

---

## 🧪 Testing

The project includes a comprehensive test suite with **140+ tests**.

```bash
# Run all tests
dotnet test

# Run unit tests only (fast, no Docker needed)
dotnet test --filter "Category=Unit"

# Run integration tests only (requires Docker)
dotnet test --filter "Category=Integration"
```

### Test Coverage
- **Unit Tests (47)** - Business logic, fleet rules, fork mapping, ownership validation
- **Integration Tests (93+)** - Full API testing with real PostgreSQL
  - Database seeding
  - Authentication flows
  - Fleet management
  - Custom ship CRUD
  - Catalog browsing & filtering

See [Tests/README.md](Tests/README.md) for detailed test documentation.

---

## 🔐 Authentication

1. **Register** a new account at `/register`
2. **Login** at `/login` to receive a JWT token
3. Access protected features: Fleet, Hangar, Ship Builder

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/starships` | List catalog starships (paginated) |
| GET | `/api/starships/{id}` | Get starship details |
| GET | `/api/films` | List all films |
| GET | `/api/people` | List all characters |
| GET | `/api/planets` | List all planets |
| GET | `/api/species` | List all species |
| GET | `/api/vehicles` | List all vehicles |

### Protected Endpoints (Requires Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fleet` | Get user's fleet |
| POST | `/api/fleet/items` | Add ship to fleet |
| PUT | `/api/fleet/items/{id}` | Update fleet item quantity |
| DELETE | `/api/fleet/items/{id}` | Remove from fleet |
| GET | `/api/mystarships` | List user's custom ships |
| POST | `/api/mystarships` | Create custom ship |
| PUT | `/api/mystarships/{id}` | Update custom ship |
| DELETE | `/api/mystarships/{id}` | Delete custom ship |
| POST | `/api/mystarships/fork/{catalogId}` | Fork a catalog ship |
---

## 🎨 Screenshots

*Coming soon*

---

## Future Enhancements

### Content Expansion
- Expand films database with extended universe content
- Add faction system with Light Side vs Dark Side vs Neutral alignment
- Incorporate faction colors and visual indicators throughout the application
- Increase art assets and visual polish for immersive experience

### LEGO Integration
- Integrate with LEGO Star Wars building mechanics
- Potentially build a bridge between digital ship design and physical LEGO models

---

## 🤖 Potential AI Features

### Ship Visualization
- **AI-Generated Ship Images** - Generate images of user-designed starships
- **Vector Export** - Export ship designs as scalable vector graphics with transparent backgrounds
- Save and share ship designs visually

### Fleet Analytics & Storytelling
- **Battle Simulation Narratives** - Generate short stories simulating epic battles between two user fleets
- **Strategic Analysis** - Provide AI-powered analysis and recommendations for fleet composition
- **Battle Prediction** - Suggest fleet balancing and strategy improvements

---

## 🎮 Game-like Features (Future)

### Multiplayer & Social
- **Friend System** - Add and connect with other players
- **Fleet Battles** - Simulate battles between player fleets with real-time results
- **Cost-Based Balance** - Implement maximum fleet cost to enforce strategic deck-building (prevents "all powerful" fleets)

### Advanced Progression
- **Multiple Fleets** - Allow players to create and manage multiple distinct fleets
- **Fleet vs Fleet Combat** - Battle your own fleets against each other for testing strategies
- **Ship Builder Constraints** - Add a balanced cost/stat system to the Ship Builder
  - Each stat point costs resources
  - Total fleet value has a maximum cap
  - Forces players to make meaningful trade-offs between speed, firepower, cargo, crew, etc.
  - Creates meta-game strategy similar to deck-building games

---

## �📋 Requirements Checklist

### Technical Requirements ✅
- [x] **.NET 8** with ASP.NET Core Web API
- [x] **Entity Framework Core** with SQL database (SQL Server + PostgreSQL support)
- [x] **Tailwind CSS** for UI styling
- [x] **SWAPI** data fetching and integration

### Starship Retrieval Exercise ✅
- [x] **Model Creation** - Starship model based on SWAPI structure
- [x] **Data Seeding** - Fetch and seed starships from SWAPI using EF Core
- [x] **Dynamic Table** - Responsive, sortable, filterable starship table
- [x] **Full CRUD** - Create, Read, Update, Delete operations via UI

### Bonus Credit ✅
- [x] **Docker Setup** - Full Docker Compose configuration
- [x] **Authentication** - JWT-based auth with registration/login
- [x] **Unit & Integration Tests** - 140+ comprehensive tests
- [x] **Creative Enhancements**:
  - Fleet management system
  - Ship Builder wizard with stat visualization
  - Ship forking (clone & customize catalog ships)
  - Films, People, Planets, Species, Vehicles browsing
  - Glass-morphism Star Wars themed UI

---

## 📄 License

This project is for educational purposes as part of a coding exercise.

---

## 🙏 Acknowledgments

- [SWAPI](https://swapi.dev/) - The Star Wars API
- [Star Wars](https://www.starwars.com/) - For the incredible universe
- [LEGO Star Wars](https://www.lego.com/en-us/themes/star-wars) - Ship Builder inspiration