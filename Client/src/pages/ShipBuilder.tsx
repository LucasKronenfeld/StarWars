import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import type { CreateMyStarshipRequest } from '../api/myStarshipsApi';
import { peopleApi } from '../api/peopleApi';
import { useToast } from '../contexts/ToastContext';

// Attribute presets for quick selection
const STARSHIP_TEMPLATES = {
  fighter: {
    name: 'Light Fighter',
    starshipClass: 'Starfighter',
    crew: 1,
    passengers: 0,
    length: 12,
    hyperdriveRating: 1.0,
    mglt: 100,
    cargoCapacity: 110,
    consumables: '1 week',
  },
  freighter: {
    name: 'Light Freighter',
    starshipClass: 'Light Freighter',
    crew: 4,
    passengers: 6,
    length: 35,
    hyperdriveRating: 0.5,
    mglt: 75,
    cargoCapacity: 100000,
    consumables: '2 months',
  },
  cruiser: {
    name: 'Cruiser',
    starshipClass: 'Cruiser',
    crew: 30,
    passengers: 600,
    length: 115,
    hyperdriveRating: 2.0,
    mglt: 60,
    cargoCapacity: 3000000,
    consumables: '1 year',
  },
  capital: {
    name: 'Capital Ship',
    starshipClass: 'Star Destroyer',
    crew: 47060,
    passengers: 0,
    length: 1600,
    hyperdriveRating: 2.0,
    mglt: 60,
    cargoCapacity: 36000000,
    consumables: '2 years',
  },
};

// Calculate ship "stats" for the radar display
function calculateStats(data: CreateMyStarshipRequest) {
  return {
    speed: Math.min(100, (data.mglt || 0) * 1),
    hyperdrive: Math.min(100, data.hyperdriveRating ? Math.max(0, 100 - (data.hyperdriveRating * 20)) : 0),
    capacity: Math.min(100, Math.log10((data.cargoCapacity || 0) + 1) * 15),
    size: Math.min(100, Math.log10((data.length || 0) + 1) * 30),
    crew: Math.min(100, Math.log10((data.crew || 0) + 1) * 20),
    endurance: Math.min(100, getConsumablesDays(data.consumables || '') / 7),
  };
}

function getConsumablesDays(consumables: string): number {
  const lower = consumables.toLowerCase();
  if (lower.includes('year')) {
    const match = lower.match(/(\d+)/);
    return (match ? parseInt(match[1]) : 1) * 365;
  }
  if (lower.includes('month')) {
    const match = lower.match(/(\d+)/);
    return (match ? parseInt(match[1]) : 1) * 30;
  }
  if (lower.includes('week')) {
    const match = lower.match(/(\d+)/);
    return (match ? parseInt(match[1]) : 1) * 7;
  }
  if (lower.includes('day')) {
    const match = lower.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
  return 0;
}

// Radar chart component for visualizing ship stats
function StatRadar({ stats }: { stats: ReturnType<typeof calculateStats> }) {
  const labels = ['Speed', 'Hyperdrive', 'Capacity', 'Size', 'Crew', 'Endurance'];
  const values = [stats.speed, stats.hyperdrive, stats.capacity, stats.size, stats.crew, stats.endurance];
  
  const center = 100;
  const maxRadius = 80;
  const angleStep = (Math.PI * 2) / 6;
  
  // Calculate points for the stat polygon
  const points = values.map((value, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  // Calculate label positions
  const labelPoints = labels.map((label, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const radius = maxRadius + 18;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      label,
      value: values[i],
    };
  });
  
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[300px] mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <polygon
          key={i}
          points={Array.from({ length: 6 }, (_, j) => {
            const angle = angleStep * j - Math.PI / 2;
            const radius = scale * maxRadius;
            return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(100, 116, 139, 0.3)"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * maxRadius}
            y2={center + Math.sin(angle) * maxRadius}
            stroke="rgba(100, 116, 139, 0.3)"
            strokeWidth="1"
          />
        );
      })}
      
      {/* Stat polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(234, 179, 8, 0.3)"
        stroke="rgb(234, 179, 8)"
        strokeWidth="2"
      />
      
      {/* Stat points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="rgb(234, 179, 8)"
        />
      ))}
      
      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-400 text-[8px] font-medium"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// Slider component with visual bar
function AttributeSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  color = 'cyan',
  logarithmic = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  logarithmic?: boolean;
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
  }[color] || 'bg-cyan-500';
  
  // For logarithmic scales, convert to/from log
  const sliderValue = logarithmic ? Math.log10(value + 1) : value;
  const sliderMin = logarithmic ? Math.log10(min + 1) : min;
  const sliderMax = logarithmic ? Math.log10(max + 1) : max;
  
  const percentage = ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100;
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    if (logarithmic) {
      onChange(Math.round(Math.pow(10, sliderVal) - 1));
    } else {
      onChange(parseFloat(sliderVal.toFixed(step < 1 ? 1 : 0)));
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">
          {value.toLocaleString()}{unit}
        </span>
      </div>
      <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${colorClasses} rounded-full transition-all duration-150`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={logarithmic ? 0.01 : step}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full h-2 appearance-none bg-transparent cursor-pointer slider-thumb"
      />
    </div>
  );
}

export function ShipBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateMyStarshipRequest>({
    name: '',
    model: '',
    manufacturer: '',
    starshipClass: '',
    costInCredits: undefined,
    length: 20,
    crew: 2,
    passengers: 4,
    cargoCapacity: 50000,
    hyperdriveRating: 1.0,
    mglt: 75,
    consumables: '1 month',
  });

  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: peopleApi.getAll,
  });
  
  const stats = useMemo(() => calculateStats(formData), [formData]);
  
  const mutation = useMutation({
    mutationFn: (data: CreateMyStarshipRequest) => myStarshipsApi.create(data),
    onSuccess: (result) => {
      toast.success('Ship created successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      navigate(`/hangar/${result.id}/edit`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error creating starship');
    },
  });
  
  const handleChange = (field: keyof CreateMyStarshipRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const applyTemplate = (templateKey: keyof typeof STARSHIP_TEMPLATES) => {
    const template = STARSHIP_TEMPLATES[templateKey];
    setFormData(prev => ({
      ...prev,
      ...template,
      name: prev.name || template.name, // Keep user's name if they set one
    }));
  };
  
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name for your ship');
      setCurrentStep(0);
      return;
    }
    mutation.mutate(formData);
  };
  
  const steps = ['Identity', 'Performance', 'Capacity', 'Review'];
  
  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-6xl mx-auto">
        {/* Header with LEGO Logo */}
        <div className="text-center mb-8">
          <a 
            href="https://www.lego.com/en-us/themes/star-wars"
            target="_blank"
            rel="noreferrer"
            className="inline-block mb-4 transition-transform hover:scale-105"
          >
            <img 
              src="/legoLogo.png" 
              alt="LEGO Star Wars" 
              className="h-16 mx-auto opacity-90 hover:opacity-100 transition-opacity"
            />
          </a>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-shadow">
            SHIP BUILDER
          </h1>
          <p className="text-gray-400">Design your perfect starship</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <button
              key={step}
              onClick={() => setCurrentStep(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                i === currentStep
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                  : i < currentStep
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400/70'
                  : 'bg-black/30 border-white/10 text-gray-500'
              }`}
            >
              {i + 1}. {step}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              {/* Step 0: Identity */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Ship Identity</h2>
                  
                  {/* Quick Start Templates */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-3">Quick Start Template</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(STARSHIP_TEMPLATES).map(([key, template]) => (
                        <button
                          key={key}
                          onClick={() => applyTemplate(key as keyof typeof STARSHIP_TEMPLATES)}
                          className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-yellow-500/50 rounded-lg p-3 text-left transition group"
                        >
                          <div className="text-2xl mb-1">
                            {key === 'fighter' && '🚀'}
                            {key === 'freighter' && '📦'}
                            {key === 'cruiser' && '🚢'}
                            {key === 'capital' && '⚔️'}
                          </div>
                          <div className="text-sm font-semibold text-gray-200 group-hover:text-yellow-400">
                            {template.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ship Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white text-lg font-semibold placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
                        placeholder="Enter ship name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        placeholder="YT-1300, TIE/IN, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Manufacturer</label>
                      <input
                        type="text"
                        value={formData.manufacturer || ''}
                        onChange={(e) => handleChange('manufacturer', e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        placeholder="Corellian Engineering, Sienar Fleet Systems..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ship Class</label>
                      <input
                        type="text"
                        value={formData.starshipClass || ''}
                        onChange={(e) => handleChange('starshipClass', e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        placeholder="Starfighter, Freighter, Cruiser..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cost (credits)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.costInCredits ?? ''}
                        onChange={(e) =>
                          handleChange(
                            'costInCredits',
                            e.target.value === '' ? undefined : parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Pilot</label>
                      <select
                        value={formData.pilotId ?? ''}
                        onChange={(e) =>
                          handleChange('pilotId', e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="">No pilot assigned</option>
                        {people?.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: Performance */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Performance Stats</h2>
                  
                  <AttributeSlider
                    label="Sublight Speed (MGLT)"
                    value={formData.mglt || 0}
                    onChange={(v) => handleChange('mglt', v)}
                    min={0}
                    max={150}
                    color="cyan"
                    unit=" MGLT"
                  />
                  
                  <AttributeSlider
                    label="Hyperdrive Rating"
                    value={formData.hyperdriveRating || 6}
                    onChange={(v) => handleChange('hyperdriveRating', v)}
                    min={0.1}
                    max={6}
                    step={0.1}
                    color="purple"
                    unit="x"
                  />
                  <p className="text-xs text-gray-500 -mt-6">Lower is faster! Class 0.5 is exceptional, Class 4+ is slow.</p>
                  
                  <AttributeSlider
                    label="Ship Length"
                    value={formData.length || 10}
                    onChange={(v) => handleChange('length', v)}
                    min={5}
                    max={2000}
                    logarithmic
                    color="yellow"
                    unit=" m"
                  />
                </div>
              )}
              
              {/* Step 2: Capacity */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Crew & Cargo</h2>
                  
                  <AttributeSlider
                    label="Crew Required"
                    value={formData.crew || 1}
                    onChange={(v) => handleChange('crew', v)}
                    min={1}
                    max={100000}
                    logarithmic
                    color="orange"
                  />
                  
                  <AttributeSlider
                    label="Passenger Capacity"
                    value={formData.passengers || 0}
                    onChange={(v) => handleChange('passengers', v)}
                    min={0}
                    max={10000}
                    logarithmic
                    color="pink"
                  />
                  
                  <AttributeSlider
                    label="Cargo Capacity"
                    value={formData.cargoCapacity || 0}
                    onChange={(v) => handleChange('cargoCapacity', v)}
                    min={0}
                    max={100000000}
                    logarithmic
                    color="green"
                    unit=" kg"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Consumables Duration</label>
                    <select
                      value={formData.consumables || ''}
                      onChange={(e) => handleChange('consumables', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="">Select...</option>
                      <option value="1 day">1 day</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                      <option value="5 years">5 years</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Review Your Ship</h2>
                  
                  <div className="bg-black/40 rounded-xl p-6 border border-white/20">
                    <h3 className="text-3xl font-black text-white mb-1">
                      {formData.name || 'Unnamed Ship'}
                    </h3>
                    {formData.model && <p className="text-gray-400 text-lg">{formData.model}</p>}
                    {formData.manufacturer && <p className="text-gray-500">{formData.manufacturer}</p>}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Class</div>
                        <div className="text-lg font-semibold">{formData.starshipClass || '—'}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Cost</div>
                        <div className="text-lg font-semibold">
                          {formData.costInCredits !== undefined && formData.costInCredits !== null
                            ? formData.costInCredits.toLocaleString()
                            : '—'}
                        </div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Length</div>
                        <div className="text-lg font-semibold">{formData.length?.toLocaleString() || '—'} m</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Crew</div>
                        <div className="text-lg font-semibold">{formData.crew?.toLocaleString() || '—'}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Passengers</div>
                        <div className="text-lg font-semibold">{formData.passengers?.toLocaleString() || '—'}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Hyperdrive</div>
                        <div className="text-lg font-semibold">Class {formData.hyperdriveRating || '—'}</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Speed</div>
                        <div className="text-lg font-semibold">{formData.mglt || '—'} MGLT</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 md:col-span-2 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Cargo</div>
                        <div className="text-lg font-semibold">{formData.cargoCapacity?.toLocaleString() || '—'} kg</div>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-gray-500 uppercase">Consumables</div>
                        <div className="text-lg font-semibold">{formData.consumables || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => currentStep === 0 ? navigate('/fleet') : setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/30 rounded-lg font-semibold transition"
                >
                  {currentStep === 0 ? '← Back to Fleet' : '← Previous'}
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-semibold transition"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={mutation.isPending || !formData.name.trim()}
                    className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black disabled:text-gray-400 rounded-lg font-bold text-lg transition"
                  >
                    {mutation.isPending ? 'Creating...' : '🚀 Build Ship'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Preview Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-300 mb-4 text-center">Ship Profile</h3>
              
              <StatRadar stats={stats} />
              
              <div className="mt-6 space-y-3">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{Math.round(value)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {formData.name && (
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <div className="text-xl font-bold text-yellow-400">{formData.name}</div>
                  {formData.starshipClass && (
                    <div className="text-sm text-gray-500">{formData.starshipClass}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #eab308;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -7px;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #eab308;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
