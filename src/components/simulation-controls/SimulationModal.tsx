import React from 'react';
import { Planet, PlanetGenerationConfig } from '../../types/planet';
import { Sparkles, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planet: Planet;
  onApplyScenario: (configDiff: Partial<PlanetGenerationConfig>, name: string) => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  planet,
  onApplyScenario
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'warming',
      name: 'Catastrophic Global Warming (+8°C)',
      description: 'Increases planetary mean temperature by +8°C. Simulates polar ice retreat, permafrost thaw, tropical desert expansion, and heightened atmospheric vapor capacity.',
      diff: { averageTemperatureC: planet.config.averageTemperatureC + 8.0 },
      affected: ['climate', 'biomes', 'cryosphere']
    },
    {
      id: 'cooling',
      name: 'Snowball Glacial Incursion (-15°C)',
      description: 'Cools planetary mean temperature by -15°C. Triggers runaway ice cap expansion down into temperate zones and severe arid tundra belts.',
      diff: { averageTemperatureC: planet.config.averageTemperatureC - 15.0 },
      affected: ['climate', 'biomes', 'glaciation']
    },
    {
      id: 'sea_rise',
      name: 'Marine Transgression (+0.18 Sea Level)',
      description: 'Raises sea level threshold by +0.18. Drowns low-lying coastal plains, fragments continents into archipelagos, expands inland epicontinental seas, and reduces terrestrial habitable area.',
      diff: { seaLevel: Math.min(0.6, planet.config.seaLevel + 0.18) },
      affected: ['seaLevel', 'landArea', 'hydrology', 'biomes']
    },
    {
      id: 'drought',
      name: 'Planetary Megadrought (-50% Rainfall)',
      description: 'Halves modeled global precipitation intensity. Subtropical and temperate grasslands undergo desertification, river flow diminishes, and forests retreat to mountain refugia.',
      diff: { precipitationIntensity: Math.max(0.2, planet.config.precipitationIntensity * 0.5) },
      affected: ['precipitation', 'moistureIndex', 'biomes']
    },
    {
      id: 'extreme_tilt',
      name: 'High Obliquity Tilt (42° Axial Tilt)',
      description: 'Increases axial tilt to 42°. Drives violent seasonal temperature oscillations between hemispheric summer midnight sun and harsh winter polar nights.',
      diff: { axialTiltDegrees: 42.0 },
      affected: ['seasonality', 'polarSwings', 'climate']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-space-700 flex items-center justify-between bg-space-850">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-mono tracking-wide uppercase">
              Environmental Simulation Scenarios
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-space-700 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          <div className="bg-amber-950/30 border border-amber-600/30 p-3.5 rounded-lg flex items-start space-x-3 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <strong>Scientific Simulation Disclosure:</strong> Scenarios use deterministic parametric models (Hadley cell circulation, Clausius-Clapeyron moisture capacity, and hypsometric marine transgression) rather than unconstrained black-box numerical approximations. Baseline planet parameters are preserved.
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="bg-space-850 border border-space-700/80 rounded-xl p-4 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">{s.name}</h3>
                    <div className="flex items-center space-x-1">
                      {s.affected.map((aff) => (
                        <span key={aff} className="text-[10px] font-mono bg-space-750 text-cyan-300 px-2 py-0.5 rounded border border-space-700">
                          {aff}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 mt-1 leading-relaxed">{s.description}</p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      onApplyScenario(s.diff, s.name);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-md"
                  >
                    <span>Execute Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
