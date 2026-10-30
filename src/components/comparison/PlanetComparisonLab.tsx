import React, { useState } from 'react';
import { Planet, PlanetGenerationConfig } from '../../types/planet';
import { PLANET_PRESETS } from '../../engine/presets/planet-presets';
import { WorldGenerator } from '../../engine/world-generator';
import { SurfaceTextureSynthesizer } from '../../engine/rendering/surface-texture';
import { Columns, Globe } from 'lucide-react';

interface PlanetComparisonLabProps {
  currentPlanet: Planet;
}

export const PlanetComparisonLab: React.FC<PlanetComparisonLabProps> = ({ currentPlanet }) => {
  const [comparePresetId, setComparePresetId] = useState<string>('desert');

  // Generate comparison planet on the fly
  const comparisonPreset = PLANET_PRESETS.find(p => p.id === comparePresetId) || PLANET_PRESETS[2];
  const comparisonConfig: PlanetGenerationConfig = {
    ...currentPlanet.config,
    ...comparisonPreset.config,
    planetType: comparisonPreset.id,
    name: comparisonPreset.name,
    seedString: 'comparison-target'
  } as PlanetGenerationConfig;

  const comparisonPlanet = WorldGenerator.generatePlanet(comparisonConfig);

  // Textures
  const currentCanvas = SurfaceTextureSynthesizer.renderTextureCanvas(currentPlanet, 'natural');
  const compCanvas = SurfaceTextureSynthesizer.renderTextureCanvas(comparisonPlanet, 'natural');

  // Deltas
  const deltaLand = comparisonPlanet.stats.landPercentage - currentPlanet.stats.landPercentage;
  const deltaTemp = comparisonPlanet.config.averageTemperatureC - currentPlanet.config.averageTemperatureC;
  const deltaElev = comparisonPlanet.stats.averageElevationM - currentPlanet.stats.averageElevationM;

  return (
    <div className="w-full h-full bg-space-950 p-6 overflow-y-auto custom-scrollbar select-none text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-space-700/80 pb-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wide text-white uppercase flex items-center space-x-2.5">
              <Columns className="w-5 h-5 text-cyan-400" />
              <span>Planet Comparison Laboratory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side quantitative benchmarking between planetary systems and geological archetypes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Compare With:</span>
            <select
              value={comparePresetId}
              onChange={(e) => setComparePresetId(e.target.value)}
              className="bg-space-900 border border-space-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              {PLANET_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Side by side Visual Comparison */}
        <div className="grid grid-cols-2 gap-6">
          {/* Planet A */}
          <div className="bg-space-900 border border-space-700/80 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-white text-sm uppercase font-mono">{currentPlanet.name} (Active)</h2>
              </div>
              <span className="text-xs font-mono text-cyan-400 uppercase">{currentPlanet.config.planetType}</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-space-700 aspect-[2/1] bg-space-950 flex items-center justify-center">
              <img src={currentCanvas.toDataURL()} alt={currentPlanet.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Planet B */}
          <div className="bg-space-900 border border-space-700/80 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-white text-sm uppercase font-mono">{comparisonPlanet.name} (Benchmark)</h2>
              </div>
              <span className="text-xs font-mono text-amber-400 uppercase">{comparisonPlanet.config.planetType}</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-space-700 aspect-[2/1] bg-space-950 flex items-center justify-center">
              <img src={compCanvas.toDataURL()} alt={comparisonPlanet.name} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Comparison Metrics & Deltas Table */}
        <div className="bg-space-900 border border-space-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white font-mono uppercase">
            Comparative Physical & Environmental Indicators
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-space-700 text-slate-400 text-left">
                  <th className="py-2.5 px-3">METRIC / INDICATOR</th>
                  <th className="py-2.5 px-3 text-cyan-400">{currentPlanet.name.toUpperCase()}</th>
                  <th className="py-2.5 px-3 text-amber-400">{comparisonPlanet.name.toUpperCase()}</th>
                  <th className="py-2.5 px-3 text-right">NET DELTA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-800">
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Planetary Radius</td>
                  <td className="py-2.5 px-3">{currentPlanet.config.radiusKm.toLocaleString()} km</td>
                  <td className="py-2.5 px-3">{comparisonPlanet.config.radiusKm.toLocaleString()} km</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-400">
                    {comparisonPlanet.config.radiusKm - currentPlanet.config.radiusKm >= 0 ? `+` : ''}
                    {(comparisonPlanet.config.radiusKm - currentPlanet.config.radiusKm).toLocaleString()} km
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Land Surface Coverage</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{currentPlanet.stats.landPercentage.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{comparisonPlanet.stats.landPercentage.toFixed(1)}%</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${deltaLand >= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                    {deltaLand >= 0 ? `+${deltaLand.toFixed(1)}%` : `${deltaLand.toFixed(1)}%`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Ocean Surface Coverage</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{currentPlanet.stats.waterPercentage.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{comparisonPlanet.stats.waterPercentage.toFixed(1)}%</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${-deltaLand >= 0 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                    {-deltaLand >= 0 ? `+${(-deltaLand).toFixed(1)}%` : `${(-deltaLand).toFixed(1)}%`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Global Mean Temperature</td>
                  <td className="py-2.5 px-3">{currentPlanet.config.averageTemperatureC.toFixed(1)} °C</td>
                  <td className="py-2.5 px-3">{comparisonPlanet.config.averageTemperatureC.toFixed(1)} °C</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${deltaTemp >= 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {deltaTemp >= 0 ? `+${deltaTemp.toFixed(1)} °C` : `${deltaTemp.toFixed(1)} °C`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Mean Crust Elevation</td>
                  <td className="py-2.5 px-3">{Math.round(currentPlanet.stats.averageElevationM).toLocaleString()} m</td>
                  <td className="py-2.5 px-3">{Math.round(comparisonPlanet.stats.averageElevationM).toLocaleString()} m</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-400">
                    {deltaElev >= 0 ? `+${Math.round(deltaElev)} m` : `${Math.round(deltaElev)} m`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Peak Mountain Elevation</td>
                  <td className="py-2.5 px-3">+{Math.round(currentPlanet.stats.maxElevationM).toLocaleString()} m</td>
                  <td className="py-2.5 px-3">+{Math.round(comparisonPlanet.stats.maxElevationM).toLocaleString()} m</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-400">
                    {comparisonPlanet.stats.maxElevationM - currentPlanet.stats.maxElevationM >= 0 ? `+` : ''}
                    {Math.round(comparisonPlanet.stats.maxElevationM - currentPlanet.stats.maxElevationM).toLocaleString()} m
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300">Axial Tilt (Obliquity)</td>
                  <td className="py-2.5 px-3">{currentPlanet.config.axialTiltDegrees.toFixed(1)}°</td>
                  <td className="py-2.5 px-3">{comparisonPlanet.config.axialTiltDegrees.toFixed(1)}°</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-400">
                    {comparisonPlanet.config.axialTiltDegrees - currentPlanet.config.axialTiltDegrees >= 0 ? `+` : ''}
                    {(comparisonPlanet.config.axialTiltDegrees - currentPlanet.config.axialTiltDegrees).toFixed(1)}°
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
