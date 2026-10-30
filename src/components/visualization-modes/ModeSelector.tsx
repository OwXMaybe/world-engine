import React from 'react';
import { VisualizationMode, Planet } from '../../types/planet';
import { BIOMES } from '../../engine/biomes/classification';
import { Eye, Mountain, Thermometer, CloudRain, Sparkles, Droplets, Compass, Layers, Activity } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  planet: Planet;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  planet
}) => {
  const modes: { id: VisualizationMode; label: string; icon: React.ReactNode }[] = [
    { id: 'natural', label: 'Natural', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'elevation', label: 'Elevation', icon: <Mountain className="w-3.5 h-3.5" /> },
    { id: 'temperature', label: 'Thermal', icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: 'precipitation', label: 'Rainfall', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { id: 'biome', label: 'Biomes', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'moisture', label: 'Moisture', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'slope', label: 'Slope', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'geological', label: 'Tectonics', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'waterDepth', label: 'Bathymetry', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'contour', label: 'Contours', icon: <Layers className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-2 pointer-events-auto">
      {/* Mode Selector Pill Bar */}
      <div className="flex items-center space-x-1 bg-space-900/90 backdrop-blur-md p-1 rounded-xl border border-space-700/80 shadow-2xl">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-space-800'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Scientific Legend Bar */}
      <div className="bg-space-900/85 backdrop-blur-md px-4 py-2 rounded-lg border border-space-700/60 shadow-xl flex items-center space-x-4 text-xs font-mono">
        {currentMode === 'elevation' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Elevation:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-cyan-400">-{Math.round(planet.config.oceanDepthMeters / 1000)}km</span>
              <div
                className="w-36 h-2.5 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #0a1931, #0077b6, #2d6a4f, #ddb892, #99582a, #ffffff)'
                }}
              />
              <span className="text-[11px] text-amber-300">+{Math.round(planet.config.maxElevationMeters / 1000)}km</span>
            </div>
          </div>
        )}

        {currentMode === 'temperature' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Temperature:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-indigo-400">-45°C</span>
              <div
                className="w-36 h-2.5 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #4b0082, #0077b6, #2a9d8f, #e9c46a, #f4a261, #e76f51, #9b2226)'
                }}
              />
              <span className="text-[11px] text-rose-400">+45°C</span>
            </div>
          </div>
        )}

        {currentMode === 'precipitation' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Annual Rainfall:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-amber-300">0 mm</span>
              <div
                className="w-36 h-2.5 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #dc9f5e, #a3b18a, #2a9d8f, #0077b6, #4361ee)'
                }}
              />
              <span className="text-[11px] text-cyan-300">3,500+ mm</span>
            </div>
          </div>
        )}

        {currentMode === 'moisture' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Moisture Index:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-amber-500">Arid (0)</span>
              <div
                className="w-32 h-2.5 rounded-full"
                style={{ background: 'linear-gradient(to right, #b4843c, #2a9d8f, #00b4d8)' }}
              />
              <span className="text-[11px] text-cyan-300">Perhumid (1.0)</span>
            </div>
          </div>
        )}

        {currentMode === 'slope' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Slope Gradient:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-slate-400">0° (Plains)</span>
              <div
                className="w-32 h-2.5 rounded-full"
                style={{ background: 'linear-gradient(to right, #1e293b, #d97706, #ef4444)' }}
              />
              <span className="text-[11px] text-rose-400">45°+ (Cliffs)</span>
            </div>
          </div>
        )}

        {currentMode === 'geological' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Tectonics:</span>
            <span className="flex items-center space-x-1 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              <span className="text-orange-400 font-semibold">Plate Boundaries</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-300">Discrete Colored Lithospheric Plates</span>
          </div>
        )}

        {currentMode === 'biome' && (
          <div className="flex items-center space-x-3 overflow-x-auto max-w-xl">
            <span className="text-slate-400 shrink-0">Biomes:</span>
            <div className="flex items-center space-x-2 shrink-0">
              {[0, 2, 3, 5, 6, 8, 11, 14].map((id) => {
                const b = BIOMES[id];
                return (
                  <div key={id} className="flex items-center space-x-1 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-slate-300">{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentMode === 'natural' && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span>Realistic photorealistic biomes, alpine snow, bathymetric marine shading, and day/night terminator.</span>
          </div>
        )}

        {currentMode === 'waterDepth' && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span className="text-cyan-400 font-semibold">Shallow Shelves (0 to -400m)</span>
            <span>→</span>
            <span className="text-blue-600 font-semibold">Bathyal Zone</span>
            <span>→</span>
            <span className="text-indigo-950 font-semibold">Abyssal Trench (&gt; -6000m)</span>
          </div>
        )}

        {currentMode === 'contour' && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <span>Topographic isolines drawn every 600m on land and 1200m in oceans.</span>
          </div>
        )}
      </div>
    </div>
  );
};
