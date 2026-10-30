import React, { useState } from 'react';
import { Planet } from '../../types/planet';
import { PlanetaryAnalytics } from '../../engine/analytics/planetary-metrics';
import { BIOMES } from '../../engine/biomes/classification';
import { Mountain, Thermometer, Sparkles, Layers } from 'lucide-react';

interface ScientificLaboratoriesProps {
  planet: Planet;
}

export const ScientificLaboratories: React.FC<ScientificLaboratoriesProps> = ({ planet }) => {
  const [labTab, setLabTab] = useState<'hypsometry' | 'climate' | 'biomes'>('hypsometry');

  const hypsometry = PlanetaryAnalytics.calculateHypsometricCurve(planet);
  const latProfile = PlanetaryAnalytics.calculateLatitudinalProfile(planet);
  const biomeRanks = PlanetaryAnalytics.calculateBiomeRankings(planet);

  // Hypsometry max count for SVG scaling
  const maxHypCount = Math.max(...hypsometry.map(h => h.count)) || 1;

  return (
    <div className="w-full h-full bg-space-950 p-6 overflow-y-auto custom-scrollbar select-none text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Lab Header & Tabs */}
        <div className="flex items-center justify-between border-b border-space-700/80 pb-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wide text-white uppercase flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Scientific Analysis Laboratories</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              In-depth quantitative geological, climatic, and ecological modeling profiles.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-space-900 p-1 rounded-xl border border-space-700">
            <button
              onClick={() => setLabTab('hypsometry')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                labTab === 'hypsometry' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-space-800'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Hypsometry & Relief</span>
            </button>
            <button
              onClick={() => setLabTab('climate')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                labTab === 'climate' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-space-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Climate & Circulation</span>
            </button>
            <button
              onClick={() => setLabTab('biomes')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                labTab === 'biomes' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-space-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Biome Distribution</span>
            </button>
          </div>
        </div>

        {/* 1. HYPSOMETRY TAB */}
        {labTab === 'hypsometry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-space-900 p-4 rounded-xl border border-space-700/80">
                <span className="text-xs font-mono uppercase text-slate-400">Deepest Oceanic Abyssal</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {Math.round(planet.stats.minElevationM).toLocaleString()} m
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Subduction trenches & ocean floors</div>
              </div>
              <div className="bg-space-900 p-4 rounded-xl border border-space-700/80">
                <span className="text-xs font-mono uppercase text-slate-400">Mean Planetary Crust</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {Math.round(planet.stats.averageElevationM).toLocaleString()} m
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Global hypsometric barycenter</div>
              </div>
              <div className="bg-space-900 p-4 rounded-xl border border-space-700/80">
                <span className="text-xs font-mono uppercase text-slate-400">Peak Mountain Orogeny</span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  +{Math.round(planet.stats.maxElevationM).toLocaleString()} m
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Convergent collision crests</div>
              </div>
            </div>

            {/* Hypsometric Curve Histogram Chart */}
            <div className="bg-space-900 p-5 rounded-xl border border-space-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono uppercase">
                    Hypsographic Elevation Frequency Distribution
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Demonstrates the characteristic planetary bimodal crust distribution between oceanic abyssal plains and continental shields.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-cyan-600" />
                    <span className="text-slate-300">Ocean Basins</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-600" />
                    <span className="text-slate-300">Continental Land</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-64 flex items-end space-x-1 pt-4 pb-2 border-b border-space-700">
                {hypsometry.map((bin, idx) => {
                  const heightPct = Math.max(3, (bin.count / maxHypCount) * 100);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 hidden group-hover:flex z-10 bg-space-800 px-2 py-1 rounded border border-space-600 text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                        {bin.elevationM >= 0 ? `+${bin.elevationM}m` : `${bin.elevationM}m`} ({bin.percentage.toFixed(1)}%)
                      </div>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          bin.isLand ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-cyan-600/80 hover:bg-cyan-400'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>{Math.round(planet.stats.minElevationM)}m (Deep Trench)</span>
                <span className="text-amber-400 font-bold">Sea Level (0m)</span>
                <span>+{Math.round(planet.stats.maxElevationM)}m (Highest Peak)</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. CLIMATE TAB */}
        {labTab === 'climate' && (
          <div className="space-y-6">
            <div className="bg-space-900 p-5 rounded-xl border border-space-700/80 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-white font-mono uppercase">
                  Latitudinal Climate & Precipitation Gradients
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mean temperature (°C) and annual precipitation (mm) averaged across latitudinal parallels from South Pole to North Pole.
                </p>
              </div>

              {/* Table / Graph of Latitude Slices */}
              <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {latProfile.map((pt, idx) => (
                  <div key={idx} className="bg-space-850 p-2.5 rounded-lg border border-space-700/60 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{pt.latitude > 0 ? `${pt.latitude}°N` : pt.latitude < 0 ? `${Math.abs(pt.latitude)}°S` : 'Equator (0°)'}</span>
                      <span className="text-slate-500">{pt.elevationM}m</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`font-bold ${pt.tempMeanC > 0 ? 'text-rose-300' : 'text-cyan-300'}`}>
                        {pt.tempMeanC > 0 ? `+${pt.tempMeanC}°C` : `${pt.tempMeanC}°C`}
                      </span>
                      <span className="text-cyan-400 font-semibold">{pt.precipMm} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Whittaker Ecological Envelopes */}
            <div className="bg-space-900 p-5 rounded-xl border border-space-700/80 space-y-3">
              <h3 className="font-bold text-sm text-white font-mono uppercase">
                Whittaker Climate Envelope Principles
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Biomes are governed by the intersection of thermal energy and available moisture. Low temperatures (&lt; 0°C) restrict vegetation to tundra and taiga regardless of moisture, while high solar radiation with deficient rainfall (&lt; 250mm) precipitates subtropical deserts. High warmth coupled with excessive rainfall produces multi-tiered tropical rainforest canopies.
              </p>
            </div>
          </div>
        )}

        {/* 3. BIOMES TAB */}
        {labTab === 'biomes' && (
          <div className="space-y-6">
            <div className="bg-space-900 p-5 rounded-xl border border-space-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono uppercase">
                    Terrestrial Ecological Biome Rankings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribution of terrestrial biomes ranked by surface area across the planet's dry landmasses.
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-400 font-bold">
                  Total Land: {Math.round(planet.stats.landAreaKm2).toLocaleString()} km²
                </div>
              </div>

              {/* Biome Ranking List */}
              <div className="space-y-2.5">
                {biomeRanks.map((b) => (
                  <div
                    key={b.id}
                    className="bg-space-850 p-3 rounded-lg border border-space-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <div>
                        <div className="font-semibold text-white text-xs">{b.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {BIOMES[b.id]?.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs shrink-0 ml-4">
                      <div className="text-cyan-300 font-bold">{b.percentage.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500">{Math.round(b.areaKm2).toLocaleString()} km²</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
