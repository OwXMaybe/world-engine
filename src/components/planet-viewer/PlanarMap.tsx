import React, { useRef, useEffect, useState } from 'react';
import { Planet, VisualizationMode, GeographicCell } from '../../types/planet';
import { SurfaceTextureSynthesizer } from '../../engine/rendering/surface-texture';
import { WorldGenerator } from '../../engine/world-generator';
import { MapPin } from 'lucide-react';

interface PlanarMapProps {
  planet: Planet;
  mode: VisualizationMode;
  onSelectCell: (cell: GeographicCell | null) => void;
  selectedCell: GeographicCell | null;
}

export const PlanarMap: React.FC<PlanarMapProps> = ({
  planet,
  mode,
  onSelectCell,
  selectedCell
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{ lat: number; lon: number; elevM: number } | null>(null);

  // Render planar map
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get rendered surface canvas
    const surfaceCanvas = SurfaceTextureSynthesizer.renderTextureCanvas(planet, mode);
    canvas.width = surfaceCanvas.width;
    canvas.height = surfaceCanvas.height;

    // Draw base layer
    ctx.drawImage(surfaceCanvas, 0, 0);

    // Draw Lat/Lon Graticule Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Parallels every 30 deg
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90.0 - lat) / 180.0) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Meridians every 45 deg
    for (let lon = -135; lon <= 135; lon += 45) {
      const x = ((lon + 180.0) / 360.0) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Special parallels: Equator (Solid Gold) & Prime Meridian (Solid Cyan)
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;

    // Equator
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
    const eqY = 0.5 * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(canvas.width, eqY);
    ctx.stroke();

    // Prime Meridian
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    const pmX = 0.5 * canvas.width;
    ctx.beginPath();
    ctx.moveTo(pmX, 0);
    ctx.lineTo(pmX, canvas.height);
    ctx.stroke();

    // Draw pin marker if selected
    if (selectedCell) {
      const pinX = ((selectedCell.longitude + 180.0) / 360.0) * canvas.width;
      const pinY = ((90.0 - selectedCell.latitude) / 180.0) * canvas.height;

      // Glow circle
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(pinX, pinY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshair
      ctx.beginPath();
      ctx.moveTo(pinX - 10, pinY);
      ctx.lineTo(pinX + 10, pinY);
      ctx.moveTo(pinX, pinY - 10);
      ctx.lineTo(pinX, pinY + 10);
      ctx.stroke();
    }
  }, [planet, mode, selectedCell]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lon = (x / rect.width) * 360.0 - 180.0;
    const lat = 90.0 - (y / rect.height) * 180.0;

    const cell = WorldGenerator.sampleGeographicCell(planet, lat, lon);
    setHoverInfo({
      lat: Math.round(lat * 10) / 10,
      lon: Math.round(lon * 10) / 10,
      elevM: Math.round(cell.elevationMeters)
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lon = (x / rect.width) * 360.0 - 180.0;
    const lat = 90.0 - (y / rect.height) * 180.0;

    const cell = WorldGenerator.sampleGeographicCell(planet, lat, lon);
    onSelectCell(cell);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-space-950 p-6 select-none overflow-hidden">
      <div className="relative max-w-5xl w-full border border-space-700/80 rounded-xl overflow-hidden shadow-2xl bg-space-900">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
          onClick={handleClick}
          className="w-full h-auto cursor-crosshair block"
        />

        {/* Map Header Overlay */}
        <div className="absolute top-3 left-3 bg-space-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-space-700/60 text-xs font-mono flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">2D EQUIRECTANGULAR PROJECTION</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">WGS-84 Geographic Grid</span>
        </div>

        {/* Hover Pill */}
        {hoverInfo && (
          <div className="absolute bottom-3 left-3 bg-space-900/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/30 text-xs font-mono flex items-center space-x-3">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">
              LAT: <strong className="text-white">{hoverInfo.lat > 0 ? `${hoverInfo.lat}°N` : `${Math.abs(hoverInfo.lat)}°S`}</strong>
            </span>
            <span className="text-slate-300">
              LON: <strong className="text-white">{hoverInfo.lon > 0 ? `${hoverInfo.lon}°E` : `${Math.abs(hoverInfo.lon)}°W`}</strong>
            </span>
            <span className="text-slate-300">
              ELEV: <strong className="text-cyan-300">{hoverInfo.elevM.toLocaleString()} m</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
