import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Planet, VisualizationMode, GeographicCell } from '../../types/planet';
import { SurfaceTextureSynthesizer } from '../../engine/rendering/surface-texture';
import { WorldGenerator } from '../../engine/world-generator';
import { GeoCoords } from '../../engine/core/coordinates';
import { RotateCw, ZoomIn, ZoomOut, Compass, Sun, Layers, Mountain } from 'lucide-react';

interface PlanetCanvasProps {
  planet: Planet;
  mode: VisualizationMode;
  onSelectCell: (cell: GeographicCell | null) => void;
  selectedCell: GeographicCell | null;
}

export const PlanetCanvas: React.FC<PlanetCanvasProps> = ({
  planet,
  mode,
  onSelectCell,
  selectedCell
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const pinMarkerRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [hoverInfo, setHoverInfo] = useState<{ lat: number; lon: number; elevM: number } | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [dayNightActive, setDayNightActive] = useState(planet.config.dayNightCycle);
  const [relief3D, setRelief3D] = useState(true);

  // Mouse interaction state for orbital rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphereRotationRef = useRef({ x: 0.1, y: 0.5 });
  const zoomDistanceRef = useRef(2.8);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = zoomDistanceRef.current;
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(5, 2, 4);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 5. Planetary Mesh with 80x80 subdivision for crisp 3D relief extrusion
    const planetGeometry = new THREE.SphereGeometry(1.0, 80, 80);
    const planetMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);
    planetMeshRef.current = planetMesh;

    // 6. Atmosphere Shell with Fresnel rim glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.045, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          vec3 atmosphereColor = vec3(0.2, 0.65, 1.0);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
    atmosphereMeshRef.current = atmosphereMesh;

    // 7. Clouds Layer
    const cloudsGeometry = new THREE.SphereGeometry(1.018, 48, 48);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 256;
    const cctx = cloudCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = 'rgba(0,0,0,0)';
      cctx.fillRect(0, 0, 512, 256);
      cctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 45; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 256;
        const cr = 20 + Math.random() * 55;
        const grad = cctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        cctx.fillStyle = grad;
        cctx.beginPath();
        cctx.arc(cx, cy, cr, 0, Math.PI * 2);
        cctx.fill();
      }
    }
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // 8. Selected Location Pin Marker
    const pinGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pinMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
    pinMesh.visible = false;
    scene.add(pinMesh);
    pinMarkerRef.current = pinMesh;

    // 9. Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isRotating && !isDraggingRef.current) {
        sphereRotationRef.current.y += 0.12 * delta;
      }

      if (planetMeshRef.current) {
        planetMeshRef.current.rotation.x = sphereRotationRef.current.x;
        planetMeshRef.current.rotation.y = sphereRotationRef.current.y;
      }

      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.x = sphereRotationRef.current.x;
        cloudsMeshRef.current.rotation.y = sphereRotationRef.current.y + clock.getElapsedTime() * 0.02;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Surface Texture on planet or mode change
  useEffect(() => {
    if (!planetMeshRef.current) return;
    const canvas = SurfaceTextureSynthesizer.renderTextureCanvas(planet, mode);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = planetMeshRef.current.material as THREE.MeshStandardMaterial;
    if (material.map) material.map.dispose();
    material.map = texture;
    material.roughness = mode === 'natural' ? 0.75 : 0.9;
    material.metalness = 0.05;
    material.needsUpdate = true;
  }, [planet, mode]);

  // Apply 3D Vertex Displacement / Relief Extrusion
  useEffect(() => {
    if (!planetMeshRef.current) return;
    const geom = planetMeshRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;

      let r = 1.0;
      if (relief3D) {
        const { lat, lon } = GeoCoords.cartesianToLatLon(nx, ny, nz);
        const cell = WorldGenerator.sampleGeographicCell(planet, lat, lon);
        if (cell.isLand) {
          // Mount peak protrusion
          r = 1.0 + (cell.elevationMeters / planet.config.maxElevationMeters) * 0.045;
        } else {
          // Ocean bathymetric recess
          r = 1.0 + (cell.elevationMeters / planet.config.oceanDepthMeters) * 0.015;
        }
      }

      posAttr.setXYZ(i, nx * r, ny * r, nz * r);
    }

    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
  }, [planet, relief3D]);

  // Update Day/Night sunlight behavior
  useEffect(() => {
    if (!sunLightRef.current) return;
    if (dayNightActive) {
      sunLightRef.current.intensity = 2.4;
      sunLightRef.current.position.set(4, 1.5, 3);
    } else {
      sunLightRef.current.intensity = 1.4;
      sunLightRef.current.position.set(0, 0, 5);
    }
  }, [dayNightActive]);

  // Update Pin marker for selected geographic cell
  useEffect(() => {
    if (!pinMarkerRef.current || !planetMeshRef.current) return;
    if (!selectedCell) {
      pinMarkerRef.current.visible = false;
      return;
    }

    const [x, y, z] = GeoCoords.latLonToCartesian(selectedCell.latitude, selectedCell.longitude);
    const pos = new THREE.Vector3(x, y, z).multiplyScalar(1.025);

    pos.applyEuler(planetMeshRef.current.rotation);
    pinMarkerRef.current.position.copy(pos);
    pinMarkerRef.current.visible = true;
  }, [selectedCell]);

  // Mouse drag & Orbit handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !planetMeshRef.current) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      sphereRotationRef.current.y += deltaX * 0.007;
      sphereRotationRef.current.x = Math.max(
        -Math.PI * 0.45,
        Math.min(Math.PI * 0.45, sphereRotationRef.current.x + deltaY * 0.007)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const intersects = raycaster.intersectObject(planetMeshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const localPoint = hit.point.clone();
      const invRotation = planetMeshRef.current.rotation.clone();
      localPoint.applyEuler(new THREE.Euler(-invRotation.x, -invRotation.y, -invRotation.z, 'ZYX'));

      const { lat, lon } = GeoCoords.cartesianToLatLon(localPoint.x, localPoint.y, localPoint.z);
      const cell = WorldGenerator.sampleGeographicCell(planet, lat, lon);
      setHoverInfo({
        lat: Math.round(lat * 10) / 10,
        lon: Math.round(lon * 10) / 10,
        elevM: Math.round(cell.elevationMeters)
      });
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const dist = Math.hypot(
      e.clientX - previousMousePositionRef.current.x,
      e.clientY - previousMousePositionRef.current.y
    );
    if (dist < 4 && containerRef.current && cameraRef.current && planetMeshRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObject(planetMeshRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const localPoint = hit.point.clone();
        const invRotation = planetMeshRef.current.rotation.clone();
        localPoint.applyEuler(new THREE.Euler(-invRotation.x, -invRotation.y, -invRotation.z, 'ZYX'));

        const { lat, lon } = GeoCoords.cartesianToLatLon(localPoint.x, localPoint.y, localPoint.z);
        const cell = WorldGenerator.sampleGeographicCell(planet, lat, lon);
        onSelectCell(cell);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.0018;
    zoomDistanceRef.current = Math.max(1.4, Math.min(6.0, zoomDistanceRef.current + zoomDelta));
    cameraRef.current.position.z = zoomDistanceRef.current;
  };

  const resetCamera = useCallback(() => {
    sphereRotationRef.current = { x: 0.1, y: 0.5 };
    zoomDistanceRef.current = 2.8;
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 2.8);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-gradient-to-b from-space-950 via-space-900 to-space-950">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating HUD Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-space-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-space-700/60 shadow-xl">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? "Pause planetary spin" : "Resume planetary spin"}
          className={`p-1.5 rounded hover:bg-space-700 transition ${isRotating ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin-slow' : ''}`} />
        </button>
        <button
          onClick={() => {
            zoomDistanceRef.current = Math.max(1.4, zoomDistanceRef.current - 0.3);
            if (cameraRef.current) cameraRef.current.position.z = zoomDistanceRef.current;
          }}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-space-700 text-slate-300 hover:text-white transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            zoomDistanceRef.current = Math.min(6.0, zoomDistanceRef.current + 0.3);
            if (cameraRef.current) cameraRef.current.position.z = zoomDistanceRef.current;
          }}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-space-700 text-slate-300 hover:text-white transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          title="Reset Camera Orientation"
          className="p-1.5 rounded hover:bg-space-700 text-slate-300 hover:text-white transition"
        >
          <Compass className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-space-700 mx-1" />
        <button
          onClick={() => setDayNightActive(!dayNightActive)}
          title={dayNightActive ? "Switch to Flat Lighting" : "Switch to Day/Night Solar Lighting"}
          className={`p-1.5 rounded hover:bg-space-700 transition ${dayNightActive ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRelief3D(!relief3D)}
          title={relief3D ? "Disable 3D Relief Extrusion" : "Enable 3D Relief Extrusion"}
          className={`p-1.5 rounded hover:bg-space-700 transition ${relief3D ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Mountain className="w-4 h-4" />
        </button>
      </div>

      {/* Surface Coordinate Inspection Hover Pill */}
      {hoverInfo && (
        <div className="absolute bottom-4 left-4 bg-space-900/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/30 shadow-2xl flex items-center space-x-3 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300">
            LAT: <strong className="text-white">{hoverInfo.lat > 0 ? `${hoverInfo.lat}°N` : `${Math.abs(hoverInfo.lat)}°S`}</strong>
          </span>
          <span className="text-slate-300">
            LON: <strong className="text-white">{hoverInfo.lon > 0 ? `${hoverInfo.lon}°E` : `${Math.abs(hoverInfo.lon)}°W`}</strong>
          </span>
          <span className="text-slate-300">
            ELEV: <strong className="text-cyan-300">{hoverInfo.elevM.toLocaleString()} m</strong>
          </span>
          <span className="text-slate-500 text-[10px] uppercase">(Click to inspect)</span>
        </div>
      )}

      {/* Active Visualization Mode Pill */}
      <div className="absolute top-4 right-4 bg-space-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-space-700/60 shadow-xl flex items-center space-x-2 text-xs">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-400 uppercase font-mono tracking-wider">Layer:</span>
        <span className="font-semibold text-white capitalize">{mode}</span>
      </div>
    </div>
  );
};
