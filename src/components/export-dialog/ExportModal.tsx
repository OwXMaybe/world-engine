import React, { useState } from 'react';
import { Planet } from '../../types/planet';
import { SurfaceTextureSynthesizer } from '../../engine/rendering/surface-texture';
import { MeshExporter } from '../../engine/export/mesh-exporter';
import { X, Download, FileText, Image as ImageIcon, Code, Check, Box } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  planet: Planet;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  planet
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerSuccess = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // 1. Export Project JSON
  const handleExportJSON = () => {
    const exportObject = {
      worldEngineVersion: '1.0.0',
      id: planet.id,
      name: planet.name,
      seedString: planet.config.seedString,
      seedHash: planet.metadata.seed,
      config: planet.config,
      stats: planet.stats,
      metadata: planet.metadata,
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${planet.name.toLowerCase().replace(/\s+/g, '-')}-config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSuccess('JSON Configuration');
  };

  // 2. Export Map Image
  const handleExportMapImage = (mode: 'elevation' | 'natural' | 'biome') => {
    const canvas = SurfaceTextureSynthesizer.renderTextureCanvas(planet, mode);
    const dataUrl = canvas.toDataURL('image/png');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataUrl);
    downloadAnchor.setAttribute('download', `${planet.name.toLowerCase().replace(/\s+/g, '-')}-${mode}-map.png`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerSuccess(`${mode.toUpperCase()} Map PNG`);
  };

  // 3. Export 3D Wavefront .OBJ Mesh
  const handleExportOBJ = () => {
    const objContent = MeshExporter.exportToOBJ(planet, 'natural', 3.0);
    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${planet.name.toLowerCase().replace(/\s+/g, '-')}-3d-mesh.obj`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    triggerSuccess('Wavefront 3D OBJ Mesh');
  };

  // 4. Export HTML Scientific Report
  const handleExportReport = () => {
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WORLD ENGINE — Planetary Dossier: ${planet.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #030712; color: #f8fafc; padding: 40px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 32px; }
    h1 { color: #38bdf8; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; background: #0284c7; color: white; font-family: monospace; font-size: 12px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    th { color: #94a3b8; font-weight: 500; font-family: monospace; font-size: 12px; }
    .highlight { color: #38bdf8; font-weight: bold; font-family: monospace; }
    .footer { font-size: 12px; color: #64748b; margin-top: 32px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PLANETARY DOSSIER: ${planet.name.toUpperCase()}</h1>
    <div class="badge">DETERMINISTIC SEED: ${planet.config.seedString}</div>
    <p>Procedurally generated and verified by WORLD ENGINE Planetary Simulation Platform.</p>
    
    <h2>1. Physical Dimensions & Surface Coverage</h2>
    <table>
      <tr><th>PARAMETER</th><th>VALUE</th></tr>
      <tr><td>Planetary Class</td><td>${planet.config.planetType.toUpperCase()}</td></tr>
      <tr><td>Radius</td><td class="highlight">${planet.config.radiusKm.toLocaleString()} km</td></tr>
      <tr><td>Total Surface Area</td><td class="highlight">${Math.round(planet.stats.totalSurfaceAreaKm2).toLocaleString()} km²</td></tr>
      <tr><td>Land Surface Area</td><td>${Math.round(planet.stats.landAreaKm2).toLocaleString()} km² (${planet.stats.landPercentage.toFixed(2)}%)</td></tr>
      <tr><td>Ocean Surface Area</td><td>${Math.round(planet.stats.waterAreaKm2).toLocaleString()} km² (${planet.stats.waterPercentage.toFixed(2)}%)</td></tr>
      <tr><td>Mean Elevation</td><td>${Math.round(planet.stats.averageElevationM).toLocaleString()} m</td></tr>
      <tr><td>Peak Elevation</td><td class="highlight">+${Math.round(planet.stats.maxElevationM).toLocaleString()} m</td></tr>
      <tr><td>Abyssal Depth</td><td class="highlight">${Math.round(planet.stats.minElevationM).toLocaleString()} m</td></tr>
    </table>

    <h2>2. Climate & Atmospheric Characteristics</h2>
    <table>
      <tr><th>VARIABLE</th><th>VALUE</th></tr>
      <tr><td>Mean Surface Temperature</td><td class="highlight">${planet.config.averageTemperatureC.toFixed(1)} °C</td></tr>
      <tr><td>Axial Tilt (Obliquity)</td><td>${planet.config.axialTiltDegrees.toFixed(2)}°</td></tr>
      <tr><td>Rotation Period</td><td>${planet.config.rotationPeriodHours.toFixed(1)} Hours</td></tr>
      <tr><td>Greenhouse Optical Factor</td><td>${planet.config.greenhouseEffect.toFixed(2)}x</td></tr>
      <tr><td>Precipitation Intensity</td><td>${planet.config.precipitationIntensity.toFixed(2)}x</td></tr>
    </table>

    <div class="footer">WORLD ENGINE &bull; Procedural Planet Generation Platform &bull; ${new Date().toUTCString()}</div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${planet.name.toLowerCase().replace(/\s+/g, '-')}-dossier.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    triggerSuccess('Scientific Dossier HTML');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-space-900 border border-space-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-space-700 flex items-center justify-between bg-space-850">
          <div className="flex items-center space-x-2.5">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-mono tracking-wide uppercase">
              Export World Assets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-space-700 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {downloadSuccess && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Downloaded <strong>{downloadSuccess}</strong> successfully.</span>
            </div>
          )}

          <div className="space-y-3">
            {/* 3D Wavefront .OBJ Mesh */}
            <button
              onClick={handleExportOBJ}
              className="w-full bg-space-850 hover:bg-space-800 border border-cyan-500/40 hover:border-cyan-400 p-3.5 rounded-xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-space-750 rounded-lg text-cyan-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">3D Wavefront Mesh (.OBJ)</div>
                  <div className="text-slate-400 text-[11px]">3D spherical mesh with displaced relief & vertex colors for Blender / Unity / Unreal.</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-cyan-400" />
            </button>

            {/* JSON Config */}
            <button
              onClick={handleExportJSON}
              className="w-full bg-space-850 hover:bg-space-800 border border-space-700/80 p-3.5 rounded-xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-space-750 rounded-lg text-cyan-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Project Configuration (JSON)</div>
                  <div className="text-slate-400 text-[11px]">Exact seed, parameters, and metadata for 100% reproducible re-generation.</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            {/* Heightmap PNG */}
            <button
              onClick={() => handleExportMapImage('elevation')}
              className="w-full bg-space-850 hover:bg-space-800 border border-space-700/80 p-3.5 rounded-xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-space-750 rounded-lg text-amber-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Hypsometric Heightmap (PNG)</div>
                  <div className="text-slate-400 text-[11px]">Equirectangular 2D elevation texture with bathymetry and topography.</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            {/* Natural Biome Map PNG */}
            <button
              onClick={() => handleExportMapImage('natural')}
              className="w-full bg-space-850 hover:bg-space-800 border border-space-700/80 p-3.5 rounded-xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-space-750 rounded-lg text-emerald-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">True Color Surface Map (PNG)</div>
                  <div className="text-slate-400 text-[11px]">Photorealistic biome, alpine snow, and ocean depth texture.</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            {/* Scientific HTML Dossier */}
            <button
              onClick={handleExportReport}
              className="w-full bg-space-850 hover:bg-space-800 border border-space-700/80 p-3.5 rounded-xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-space-750 rounded-lg text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Scientific Dossier Report (HTML)</div>
                  <div className="text-slate-400 text-[11px]">Printable scientific breakdown with all surface area calculations.</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
