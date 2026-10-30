import React from 'react';
import { Planet, GeographicCell } from '../../types/planet';
import { Globe, MapPin, Thermometer, Mountain, Activity, Compass, X } from 'lucide-react';

interface InspectorPanelProps {
  planet: Planet;
  selectedCell: GeographicCell | null;
  onClearSelection: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  planet,
  selectedCell,
  onClearSelection
}) => {
  return (
    <div className="w-80 h-full bg-space-900/95 backdrop-blur-md border-l border-space-700/60 flex flex-col overflow-y-auto custom-scrollbar select-none text-slate-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-space-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">
            {selectedCell ? 'Geographic Inspector' : 'Planetary Metrics'}
          </h2>
        </div>
        {selectedCell && (
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-space-800 rounded text-slate-400 hover:text-white transition"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-6 flex-1">
        {selectedCell ? (
          /* Detailed Selected Cell Inspection */
          <div className="space-y-5 animate-fadeIn">
            {/* Coordinates Banner */}
            <div className="bg-space-850 p-3.5 rounded-lg border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-slate-300">Coordinates</span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-white font-semibold">
                  {selectedCell.latitude >= 0 ? `${selectedCell.latitude.toFixed(1)}°N` : `${Math.abs(selectedCell.latitude).toFixed(1)}°S`}
                  {', '}
                  {selectedCell.longitude >= 0 ? `${selectedCell.longitude.toFixed(1)}°E` : `${Math.abs(selectedCell.longitude).toFixed(1)}°W`}
                </div>
              </div>
            </div>

            {/* Biome Card */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Ecosystem / Biome</span>
                <span
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: selectedCell.biome.color }}
                />
              </div>
              <div className="text-base font-bold text-white flex items-center space-x-2">
                <span>{selectedCell.biome.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedCell.biome.description}
              </p>
            </div>

            {/* Topography & Elevation */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                <span>Elevation & Relief</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <div className="text-slate-400">Physical Altitude</div>
                  <div className={`text-sm font-mono font-bold ${selectedCell.elevationMeters >= 0 ? 'text-amber-300' : 'text-cyan-400'}`}>
                    {selectedCell.elevationMeters >= 0 ? `+${Math.round(selectedCell.elevationMeters).toLocaleString()} m` : `${Math.round(selectedCell.elevationMeters).toLocaleString()} m`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Terrain Slope</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {selectedCell.slopeDegrees.toFixed(1)}°
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Surface State</div>
                  <div className="text-xs font-semibold text-white">
                    {selectedCell.isLand ? 'Continental Crust' : 'Submerged Ocean Floor'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Hydrology</div>
                  <div className="text-xs font-semibold text-cyan-300">
                    {selectedCell.isRiver ? 'Active River Channel' : selectedCell.isLake ? 'Inland Water Basin' : selectedCell.isLand ? 'Dry Land' : 'Ocean'}
                  </div>
                </div>
              </div>
            </div>

            {/* Climate & Atmosphere */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Local Climate</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <div className="text-slate-400">Annual Mean Temp</div>
                  <div className="text-sm font-mono font-bold text-rose-300">
                    {selectedCell.temperatureC.toFixed(1)} °C
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Seasonal Swing</div>
                  <div className="text-sm font-mono font-bold text-white">
                    ±{(selectedCell.seasonalRangeC / 2).toFixed(1)} °C
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Precipitation</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {Math.round(selectedCell.precipitationMm).toLocaleString()} mm/yr
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Moisture Index</div>
                  <div className="text-sm font-mono font-bold text-emerald-300">
                    {(selectedCell.moistureIndex * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Geology */}
            <div className="bg-space-850 p-3.5 rounded-lg border border-space-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-400">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tectonic Plate Sector</span>
              </div>
              <div className="font-mono font-bold text-white">
                Plate #{selectedCell.plateId + 1}
              </div>
            </div>
          </div>
        ) : (
          /* Global Planet Overview Stats */
          <div className="space-y-5 animate-fadeIn">
            {/* World Identity */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-2">
              <div className="text-[11px] font-mono uppercase text-cyan-400 tracking-wider">Active Planet</div>
              <div className="text-lg font-bold text-white">{planet.name}</div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Class: <strong className="text-slate-200 capitalize">{planet.config.planetType}</strong></span>
                <span>Radius: <strong className="text-slate-200">{planet.config.radiusKm.toLocaleString()} km</strong></span>
              </div>
            </div>

            {/* Surface Coverage */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
                <span>Surface Area Coverage</span>
                <span className="text-white font-bold">{Math.round(planet.stats.totalSurfaceAreaKm2 / 1e6)} M km²</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-space-950 rounded-full overflow-hidden flex border border-space-700">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${planet.stats.landPercentage}%` }}
                  title={`Land: ${planet.stats.landPercentage.toFixed(1)}%`}
                />
                <div
                  className="h-full bg-cyan-600 transition-all duration-500"
                  style={{ width: `${planet.stats.waterPercentage}%` }}
                  title={`Oceans: ${planet.stats.waterPercentage.toFixed(1)}%`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
                  <span className="text-slate-300">Land: <strong>{planet.stats.landPercentage.toFixed(1)}%</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-600" />
                  <span className="text-slate-300">Water: <strong>{planet.stats.waterPercentage.toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Hypsometric Extremes */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                <span>Planetary Elevation Range</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Peak Mountain</div>
                  <div className="text-sm font-mono font-bold text-amber-300">
                    +{Math.round(planet.stats.maxElevationM).toLocaleString()} m
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Deepest Trench</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">
                    {Math.round(planet.stats.minElevationM).toLocaleString()} m
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Mean Crust Level</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {Math.round(planet.stats.averageElevationM).toLocaleString()} m
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Sea Level Setting</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {planet.config.seaLevel.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Provenance */}
            <div className="bg-space-850 p-4 rounded-lg border border-space-700/60 space-y-2 text-xs">
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deterministic Seed & Engine</span>
              </div>
              <div className="font-mono text-slate-300 text-[11px] bg-space-950 p-2 rounded border border-space-700 overflow-x-auto">
                Seed: <span className="text-cyan-300">{planet.config.seedString}</span>
                <div className="text-slate-500 mt-0.5">Hash: 0x{planet.metadata.seed.toString(16).toUpperCase()}</div>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Generation Time:</span>
                <span className="font-mono text-white font-semibold">{planet.metadata.generationDurationMs} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
