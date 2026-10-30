import React, { useState, useCallback } from 'react';
import { Planet, PlanetGenerationConfig, VisualizationMode, GeographicCell } from './types/planet';
import { WorldGenerator } from './engine/world-generator';
import { getDefaultConfig } from './engine/presets/planet-presets';
import { TopBar, ActiveView } from './components/layout/TopBar';
import { PlanetCanvas } from './components/planet-viewer/PlanetCanvas';
import { PlanarMap } from './components/planet-viewer/PlanarMap';
import { ScientificLaboratories } from './components/laboratories/ScientificLaboratories';
import { PlanetComparisonLab } from './components/comparison/PlanetComparisonLab';
import { ParameterPanel } from './components/parameter-panel/ParameterPanel';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { ModeSelector } from './components/visualization-modes/ModeSelector';
import { SimulationModal } from './components/simulation-controls/SimulationModal';
import { ExportModal } from './components/export-dialog/ExportModal';

export const App: React.FC = () => {
  // 1. Initial planet generation
  const [config, setConfig] = useState<PlanetGenerationConfig>(() => {
    const saved = localStorage.getItem('world_engine_active_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return getDefaultConfig('genesis-prime');
  });

  const [planet, setPlanet] = useState<Planet>(() => {
    return WorldGenerator.generatePlanet(config);
  });

  const [activeView, setActiveView] = useState<ActiveView>('globe');
  const [mode, setMode] = useState<VisualizationMode>('natural');
  const [selectedCell, setSelectedCell] = useState<GeographicCell | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Full regeneration
  const regeneratePlanet = useCallback((newConfig: PlanetGenerationConfig) => {
    const p = WorldGenerator.generatePlanet(newConfig);
    setPlanet(p);
    setConfig(newConfig);
    setSelectedCell(null);
    setIsSaved(false);
  }, []);

  // Update Sea Level with selective invalidation
  const handleSeaLevelChange = useCallback((newSeaLevel: number) => {
    const updated = WorldGenerator.updateSeaLevel(planet, newSeaLevel);
    setPlanet(updated);
    setConfig(updated.config);
    if (selectedCell) {
      const updatedCell = WorldGenerator.sampleGeographicCell(updated, selectedCell.latitude, selectedCell.longitude);
      setSelectedCell(updatedCell);
    }
    setIsSaved(false);
  }, [planet, selectedCell]);

  // Update Climate with selective invalidation
  const handleClimateChange = useCallback((diff: Partial<PlanetGenerationConfig>) => {
    const updated = WorldGenerator.updateClimate(planet, diff);
    setPlanet(updated);
    setConfig(updated.config);
    if (selectedCell) {
      const updatedCell = WorldGenerator.sampleGeographicCell(updated, selectedCell.latitude, selectedCell.longitude);
      setSelectedCell(updatedCell);
    }
    setIsSaved(false);
  }, [planet, selectedCell]);

  // Seed Change
  const handleSeedChange = useCallback((newSeedString: string) => {
    const updatedConfig: PlanetGenerationConfig = {
      ...config,
      seedString: newSeedString
    };
    regeneratePlanet(updatedConfig);
  }, [config, regeneratePlanet]);

  // Planet Name Change
  const handleNameChange = useCallback((newName: string) => {
    setPlanet(prev => ({ ...prev, name: newName, config: { ...prev.config, name: newName } }));
    setConfig(prev => ({ ...prev, name: newName }));
    setIsSaved(false);
  }, []);

  // Save to LocalStorage
  const handleSave = useCallback(() => {
    localStorage.setItem('world_engine_active_config', JSON.stringify(planet.config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [planet]);

  // Apply Simulation Scenario
  const handleApplyScenario = useCallback((diff: Partial<PlanetGenerationConfig>) => {
    if ('seaLevel' in diff && typeof diff.seaLevel === 'number') {
      handleSeaLevelChange(diff.seaLevel);
    } else {
      handleClimateChange(diff);
    }
  }, [handleSeaLevelChange, handleClimateChange]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-space-950 font-sans">
      {/* Top Application Bar */}
      <TopBar
        planet={planet}
        activeView={activeView}
        onViewChange={setActiveView}
        onSeedChange={handleSeedChange}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onExport={() => setIsExportModalOpen(true)}
        onToggleSimModal={() => setIsSimModalOpen(true)}
        isSaved={isSaved}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Parameter Control Panel */}
        <ParameterPanel
          planet={planet}
          onConfigChange={(newCfg) => regeneratePlanet(newCfg)}
          onSeaLevelChange={handleSeaLevelChange}
          onClimateChange={handleClimateChange}
          onRegenerate={() => regeneratePlanet(planet.config)}
        />

        {/* Center: Dynamic View Area */}
        <div className="flex-1 relative h-full overflow-hidden">
          {/* Mode Selector visible for Globe & Map views */}
          {(activeView === 'globe' || activeView === 'map') && (
            <ModeSelector
              currentMode={mode}
              onModeChange={setMode}
              planet={planet}
            />
          )}

          {activeView === 'globe' && (
            <PlanetCanvas
              planet={planet}
              mode={mode}
              onSelectCell={setSelectedCell}
              selectedCell={selectedCell}
            />
          )}

          {activeView === 'map' && (
            <PlanarMap
              planet={planet}
              mode={mode}
              onSelectCell={setSelectedCell}
              selectedCell={selectedCell}
            />
          )}

          {activeView === 'laboratories' && (
            <ScientificLaboratories planet={planet} />
          )}

          {activeView === 'comparison' && (
            <PlanetComparisonLab currentPlanet={planet} />
          )}
        </div>

        {/* Right Side: Scientific Geographic & Planetary Inspector */}
        <InspectorPanel
          planet={planet}
          selectedCell={selectedCell}
          onClearSelection={() => setSelectedCell(null)}
        />
      </div>

      {/* Simulation Scenario Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        planet={planet}
        onApplyScenario={handleApplyScenario}
      />

      {/* Export Assets Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        planet={planet}
      />
    </div>
  );
};
