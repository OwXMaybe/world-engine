import React, { useState } from 'react';
import { Planet } from '../../types/planet';
import { Globe, Dice5, Copy, Check, Save, Download, Sparkles } from 'lucide-react';

interface TopBarProps {
  planet: Planet;
  onSeedChange: (newSeedString: string) => void;
  onNameChange: (newName: string) => void;
  onSave: () => void;
  onExport: () => void;
  onToggleSimModal: () => void;
  isSaved: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  planet,
  onSeedChange,
  onNameChange,
  onSave,
  onExport,
  onToggleSimModal,
  isSaved
}) => {
  const [copied, setCopied] = useState(false);
  const [seedInput, setSeedInput] = useState(planet.config.seedString);

  const handleRandomSeed = () => {
    const randomWords = [
      'aurora-prime', 'valkyrie-9', 'solaria-x', 'astralis', 'zenith-c', 'hyperion',
      'cygnus-major', 'terra-nova', 'arcadia-5', 'polaris-b', 'borealis', 'elysium'
    ];
    const newSeed = randomWords[Math.floor(Math.random() * randomWords.length)] + '-' + Math.floor(Math.random() * 900 + 100);
    setSeedInput(newSeed);
    onSeedChange(newSeed);
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(planet.config.seedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seedInput.trim()) {
      onSeedChange(seedInput.trim());
    }
  };

  return (
    <header className="h-14 bg-space-900 border-b border-space-700/60 px-5 flex items-center justify-between select-none z-20">
      {/* Brand & Planet Name */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-widest text-white uppercase font-mono">
              World Engine
            </h1>
            <div className="text-[10px] text-cyan-400 font-mono tracking-wider -mt-0.5">
              PROCEDURAL PLANETARY SIMULATION
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-space-700" />

        {/* Planet Name Editor */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={planet.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-space-800 text-white font-medium text-xs px-2.5 py-1 rounded border border-space-700 focus:outline-none focus:border-cyan-400 transition w-36"
            title="Planet Name"
          />
        </div>
      </div>

      {/* Seed Controls */}
      <form onSubmit={handleSeedSubmit} className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 bg-space-800 px-2.5 py-1 rounded-lg border border-space-700">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Seed:</span>
          <input
            type="text"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            className="bg-transparent text-cyan-300 font-mono text-xs w-32 focus:outline-none"
            placeholder="Seed string..."
          />
          <button
            type="button"
            onClick={handleCopySeed}
            className="p-1 hover:bg-space-700 rounded text-slate-400 hover:text-white transition"
            title="Copy Seed"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRandomSeed}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-space-800 hover:bg-space-700 border border-space-700 text-slate-200 rounded-lg text-xs font-medium transition"
          title="Roll Random Seed"
        >
          <Dice5 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Randomize</span>
        </button>
      </form>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSimModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-space-800 hover:bg-space-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sim Scenarios</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-space-800 hover:bg-space-700 text-slate-200 border border-space-700 rounded-lg text-xs font-medium transition shadow-md"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onSave}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-md ${
            isSaved
              ? 'bg-emerald-700 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaved ? 'Saved' : 'Save Planet'}</span>
        </button>
      </div>
    </header>
  );
};
