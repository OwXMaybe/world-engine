import React, { useState } from 'react';
import { Planet, PlanetGenerationConfig } from '../../types/planet';
import { PLANET_PRESETS, PlanetPreset } from '../../engine/presets/planet-presets';
import { Sliders, RefreshCw, Waves } from 'lucide-react';

interface ParameterPanelProps {
  planet: Planet;
  onConfigChange: (newConfig: PlanetGenerationConfig) => void;
  onSeaLevelChange: (newSeaLevel: number) => void;
  onClimateChange: (diff: Partial<PlanetGenerationConfig>) => void;
  onRegenerate: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  planet,
  onConfigChange,
  onSeaLevelChange,
  onClimateChange,
  onRegenerate
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'terrain' | 'water' | 'climate'>('water');

  const config = planet.config;

  const handlePresetSelect = (preset: PlanetPreset) => {
    onConfigChange({
      ...config,
      ...preset.config,
      planetType: preset.id,
      name: preset.name
    } as PlanetGenerationConfig);
  };

  return (
    <div className="w-80 h-full bg-space-900/95 backdrop-blur-md border-r border-space-700/60 flex flex-col overflow-y-auto custom-scrollbar select-none text-slate-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-space-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-sm tracking-wide text-white uppercase font-mono">
            World Parameters
          </h2>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium shadow-md transition"
          title="Regenerate Planet"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Regen</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-space-700/60 text-xs font-mono">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${activeTab === 'preset' ? 'border-cyan-400 text-cyan-300 bg-space-850' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${activeTab === 'water' ? 'border-cyan-400 text-cyan-300 bg-space-850' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Hydrology
        </button>
        <button
          onClick={() => setActiveTab('terrain')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${activeTab === 'terrain' ? 'border-cyan-400 text-cyan-300 bg-space-850' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Terrain
        </button>
        <button
          onClick={() => setActiveTab('climate')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${activeTab === 'climate' ? 'border-cyan-400 text-cyan-300 bg-space-850' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Climate
        </button>
      </div>

      <div className="p-5 space-y-6 flex-1 text-xs">
        {/* PRESETS TAB */}
        {activeTab === 'preset' && (
          <div className="space-y-4">
            <div className="text-slate-400 text-[11px] leading-relaxed">
              Choose an archetypal planetary preset. Presets initialize physically consistent atmospheric, tectonic, and thermal parameters.
            </div>
            <div className="space-y-2.5">
              {PLANET_PRESETS.map((preset) => {
                const isSelected = config.planetType === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-space-800 border-cyan-400 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-space-850 border-space-700/60 hover:border-slate-500 hover:bg-space-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{preset.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{preset.id}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* HYDROLOGY / WATER TAB */}
        {activeTab === 'water' && (
          <div className="space-y-5">
            <div className="bg-space-850 p-3 rounded-lg border border-cyan-500/20 text-slate-300 text-[11px] leading-relaxed flex items-start space-x-2">
              <Waves className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <span>
                Adjusting <strong>Sea Level</strong> live-recalculates land/water classifications, coastal flooding, ocean surface area %, and dependent biomes without rebuilding the terrain.
              </span>
            </div>

            {/* Sea Level Slider */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Global Sea Level</label>
                <span className="font-mono font-bold text-cyan-300">{config.seaLevel.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.60"
                max="0.60"
                step="0.02"
                value={config.seaLevel}
                onChange={(e) => onSeaLevelChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Glacial Regression (-0.6)</span>
                <span>Baseline (0.0)</span>
                <span>Transgression (+0.6)</span>
              </div>
            </div>

            {/* River Density Threshold */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">River Network Density</label>
                <span className="font-mono font-bold text-cyan-300">{(config.riverDensityThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.riverDensityThreshold}
                onChange={(e) => onConfigChange({ ...config, riverDensityThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Controls the drainage accumulation threshold required to carve visible river channels.
              </div>
            </div>

            {/* Ocean Depth */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Abyssal Trench Depth</label>
                <span className="font-mono font-bold text-cyan-300">{config.oceanDepthMeters.toLocaleString()} m</span>
              </div>
              <input
                type="range"
                min="4000"
                max="15000"
                step="500"
                value={config.oceanDepthMeters}
                onChange={(e) => onConfigChange({ ...config, oceanDepthMeters: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TERRAIN TAB */}
        {activeTab === 'terrain' && (
          <div className="space-y-5">
            {/* Land Coverage Target */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Land Target Ratio</label>
                <span className="font-mono font-bold text-emerald-400">{(config.landCoverage * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.85"
                step="0.02"
                value={config.landCoverage}
                onChange={(e) => onConfigChange({ ...config, landCoverage: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Macro-continental elevation bias for land vs ocean baselines.
              </div>
            </div>

            {/* Continent Count */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Tectonic Landmasses</label>
                <span className="font-mono font-bold text-white">{config.continentCount}</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={config.continentCount}
                onChange={(e) => onConfigChange({ ...config, continentCount: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Mountain Intensity */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Mountain Orogeny Intensity</label>
                <span className="font-mono font-bold text-amber-300">{config.mountainIntensity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.2"
                step="0.1"
                value={config.mountainIntensity}
                onChange={(e) => onConfigChange({ ...config, mountainIntensity: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Peak Elevation */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Peak Mountain Elevation</label>
                <span className="font-mono font-bold text-amber-300">{config.maxElevationMeters.toLocaleString()} m</span>
              </div>
              <input
                type="range"
                min="3000"
                max="16000"
                step="500"
                value={config.maxElevationMeters}
                onChange={(e) => onConfigChange({ ...config, maxElevationMeters: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Erosion Strength */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Hydraulic / Fluvial Erosion</label>
                <span className="font-mono font-bold text-cyan-300">{(config.erosionStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.erosionStrength}
                onChange={(e) => onConfigChange({ ...config, erosionStrength: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* CLIMATE TAB */}
        {activeTab === 'climate' && (
          <div className="space-y-5">
            {/* Global Mean Temperature */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Global Average Temp</label>
                <span className="font-mono font-bold text-rose-300">{config.averageTemperatureC.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="-30"
                max="45"
                step="1"
                value={config.averageTemperatureC}
                onChange={(e) => onClimateChange({ averageTemperatureC: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Snowball (-30°C)</span>
                <span>Earth (15°C)</span>
                <span>Hothouse (45°C)</span>
              </div>
            </div>

            {/* Axial Tilt */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Planetary Axial Tilt</label>
                <span className="font-mono font-bold text-white">{config.axialTiltDegrees.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={config.axialTiltDegrees}
                onChange={(e) => onClimateChange({ axialTiltDegrees: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">
                Dictates the amplitude of polar seasonal temperature extremes.
              </div>
            </div>

            {/* Precipitation Intensity */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Precipitation Factor</label>
                <span className="font-mono font-bold text-cyan-300">{config.precipitationIntensity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={config.precipitationIntensity}
                onChange={(e) => onClimateChange({ precipitationIntensity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Greenhouse Parameter */}
            <div className="space-y-2 bg-space-850 p-3.5 rounded-lg border border-space-700/60">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-200">Greenhouse Optical Depth</label>
                <span className="font-mono font-bold text-amber-300">{config.greenhouseEffect.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.1"
                value={config.greenhouseEffect}
                onChange={(e) => onClimateChange({ greenhouseEffect: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
