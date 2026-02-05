import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { GlassCard } from '../components/GlassCard';

// All starships with their SVG assets - now all same size
const allStarships = [
  { name: 'Millennium Falcon', image: '/falcon.svg', description: 'YT-1300 Light Freighter' },
  { name: 'X-Wing', image: '/xwing.svg', description: 'T-65B X-wing starfighter' },
  { name: 'TIE Fighter', image: '/tie.svg', description: 'TIE/ln space superiority starfighter' },
  { name: 'Star Destroyer', image: '/stardestroyer.svg', description: 'Imperial I-class Star Destroyer' },
  { name: 'Death Star', image: '/death star.svg', description: 'DS-1 Orbital Battle Station' },
  { name: 'Slave I', image: '/slave1green.svg', description: 'Firespray-31-class patrol craft' },
  { name: 'Super Star Destroyer', image: '/superstardestroyer.svg', description: 'Executor-class Star Dreadnought' },
  { name: 'Venator', image: '/venator.svg', description: 'Venator-class Star Destroyer' },
  { name: 'N-1 Starfighter', image: '/n1starfighter.svg', description: 'Naboo Royal N-1 Starfighter' },
];

const features = [
  {
    title: 'Cinematic Film Experience',
    description: 'Experience the saga through authentic movie-style opening crawls for all films in the franchise.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    title: 'Cross-Linked Data',
    description: 'Explore connections between films, characters, planets, species, and vehicles across the galaxy.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: 'Build Custom Starships',
    description: 'Design and create your own unique starships with custom specifications and capabilities.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    title: 'Fork & Modify Ships',
    description: 'Take any ship from the catalog and fork it into your own customizable variant.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    title: 'Assemble Your Fleet',
    description: 'Build and manage your personal fleet combining both catalog ships and custom creations.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Complete Star Wars Database',
    description: 'Access detailed information on every starship, vehicle, character, and planet in the universe.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
];

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Battle scene - all ships in scrolling content, not fixed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          
          {/* === CAPITAL SHIPS (background layer) === */}
          {/* Star Destroyer - left side background */}
          <img src="/stardestroyer.svg" alt="" className="absolute top-[8%] left-[2%] w-56 transform -rotate-6 opacity-[0.15]" />
          
          {/* Super Star Destroyer - bottom background, massive */}
          <img src="/superstardestroyer.svg" alt="" className="absolute bottom-[5%] left-[10%] w-80 transform rotate-3 opacity-[0.12]" />
          
          {/* Death Star - top right, prominent */}
          <img src="/death star.svg" alt="" className="absolute top-[5%] right-[5%] w-36 opacity-[0.2]" />
          
          {/* === MILLENNIUM FALCON being chased === */}
          {/* Falcon - center-left, fleeing toward top-left */}
          <img src="/falcon.svg" alt="" className="absolute top-[35%] left-[18%] w-24 transform -rotate-[30deg] opacity-[0.25]" />
          
          {/* TIEs chasing the Falcon */}
          <img src="/tie.svg" alt="" className="absolute top-[45%] left-[12%] w-10 transform -rotate-[30deg] opacity-[0.22]" />
          <img src="/tie.svg" alt="" className="absolute top-[48%] left-[8%] w-9 transform -rotate-[30deg] opacity-[0.20]" />
          <img src="/tie.svg" alt="" className="absolute top-[42%] left-[5%] w-8 transform -rotate-[30deg] opacity-[0.18]" />
          
          {/* === SLAVE I (Boba Fett's ship) === */}
          <img src="/slave1green.svg" alt="" className="absolute bottom-[25%] right-[8%] w-20 transform rotate-12 opacity-[0.22]" />
          
          {/* === X-WING SQUADRON fleeing (2 ships) === */}
          <img src="/xwing.svg" alt="" className="absolute top-[20%] right-[20%] w-14 transform rotate-[35deg] opacity-[0.22]" />
          <img src="/xwing.svg" alt="" className="absolute top-[26%] right-[28%] w-12 transform rotate-[35deg] opacity-[0.18]" />
          
          {/* === TIE FIGHTER SWARM chasing X-wings (5 ships) === */}
          <img src="/tie.svg" alt="" className="absolute top-[32%] right-[15%] w-12 transform rotate-[35deg] opacity-[0.24]" />
          <img src="/tie.svg" alt="" className="absolute top-[36%] right-[22%] w-11 transform rotate-[35deg] opacity-[0.22]" />
          <img src="/tie.svg" alt="" className="absolute top-[40%] right-[18%] w-10 transform rotate-[35deg] opacity-[0.20]" />
          <img src="/tie.svg" alt="" className="absolute top-[38%] right-[28%] w-10 transform rotate-[35deg] opacity-[0.18]" />
          <img src="/tie.svg" alt="" className="absolute top-[44%] right-[25%] w-9 transform rotate-[35deg] opacity-[0.16]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/logo.svg" 
              alt="Star Wars Fleet" 
              className="h-24 sm:h-32 mx-auto drop-shadow-2xl"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 text-shadow tracking-tight">
            Command Your Own
            <span className="block text-yellow-400 mt-2">Galactic Fleet</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Explore the complete Star Wars universe. Browse iconic starships, 
            discover character connections, and build your ultimate fleet.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/catalog"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 
                       rounded-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 
                       hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 btn-glow"
            >
              Browse Starships
            </Link>
            <Link
              to={isAuthenticated ? '/fleet' : '/register'}
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-white/10 
                       border border-white/20 rounded-lg backdrop-blur-sm
                       hover:bg-white/20 hover:border-white/30 transition-all duration-300"
            >
              {isAuthenticated ? 'View My Fleet' : 'Get Started'}
            </Link>
          </div>

          {/* Quick stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">55</div>
              <div className="text-xs sm:text-sm text-gray-400">Starships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">11</div>
              <div className="text-xs sm:text-sm text-gray-400">Films</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">125</div>
              <div className="text-xs sm:text-sm text-gray-400">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">81</div>
              <div className="text-xs sm:text-sm text-gray-400">Planets</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - NOW BEFORE STARSHIPS */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-shadow">
              Everything You Need
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful tools to explore, customize, and command your Star Wars experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <GlassCard 
                key={feature.title}
                variant={index === 0 ? 'yellow' : index === 4 ? 'cyan' : 'default'}
                className="p-6"
              >
                <div className="text-yellow-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Iconic Starships Section - NOW AFTER FEATURES */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-shadow">
              Iconic Starships
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From nimble fighters to massive capital ships, explore the most legendary vessels in the galaxy.
            </p>
          </div>

          {/* All ships in consistent grid - NO SHRINKING */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
            {allStarships.map((ship) => (
              <GlassCard 
                key={ship.name} 
                variant="yellow"
                className="p-4 sm:p-6 group cursor-pointer"
              >
                <div className="aspect-square flex items-center justify-center mb-4 overflow-hidden">
                  <img 
                    src={ship.image} 
                    alt={ship.name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white text-center mb-1">
                  {ship.name}
                </h3>
                <p className="text-xs text-gray-500 text-center hidden sm:block">
                  {ship.description}
                </p>
              </GlassCard>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              View all starships
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="yellow" className="p-8 sm:p-12 text-center glow-yellow">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              {isAuthenticated 
                ? 'Your fleet awaits. Explore the catalog, build custom ships, and assemble the ultimate armada.'
                : 'Join thousands of Star Wars fans. Create your account and start building your fleet today.'}
            </p>
            <Link
              to={isAuthenticated ? '/fleet' : '/register'}
              className="inline-block px-10 py-4 text-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 
                       rounded-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 
                       hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300"
            >
              {isAuthenticated ? 'Go to My Fleet' : 'Create Free Account'}
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>Star Wars Fleet Manager — Built for fans, by fans</p>
          <p className="mt-2 text-xs">Star Wars and all related marks are trademarks of Lucasfilm Ltd.</p>
        </div>
      </footer>
    </div>
  );
}
