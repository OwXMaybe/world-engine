# WORLD ENGINE
### CREATE WORLDS. DEFINE THEIR RULES. EXPLORE THE UNKNOWN.
**Procedural Planet Generation & Interactive Environmental Simulation Platform**

---

## Overview

**WORLD ENGINE** is a scientific world-building and procedural simulation platform that generates complete virtual planets with continents, oceans, mountain ranges, river networks, climate zones, and ecological biomes. Rather than generating a simple random terrain mesh, WORLD ENGINE maintains a strongly-typed underlying geographic data model where all terrain, hydrology, thermal regimes, precipitation, and ecosystems are mathematically coupled.

---

## Key Features

1. **Deterministic Procedural Generation**:
   - Seeded 32-bit PRNG (`Mulberry32` & `MurmurHash3`) with independent sub-streams for terrain, tectonics, climate, hydrology, and biomes.
   - Any planet can be 100% reproduced using its seed string.

2. **Spherical Coordinate & Geodesic Architecture**:
   - Seamless 3D Cartesian $\leftrightarrow$ Spherical (Latitude, Longitude) transformations with zero polar distortion.
   - Rigorous solid-angle spherical area integration ($\cos(\phi) d\phi d\lambda$) ensuring equatorial and polar coverage percentages are exact.

3. **Multi-Scale Terrain & Tectonic Orogeny**:
   - Continental-scale domain-warped 3D Simplex noise.
   - Spherical Voronoi lithospheric plate partitioning with kinematic drift vectors and convergent collision orogeny.
   - Ridged multifractal mountain crests and hydraulic erosion sediment redistribution.

4. **Hydrological Drainage & Oceans**:
   - Real-time Sea-Level modulation with instant hypsometric regression/transgression.
   - D8 downhill drainage flow direction and upstream catchment accumulation for river network extraction.

5. **Climate Simulation Engine**:
   - Solar insolation gradient based on latitude and seasonal axial tilt ($\theta_{tilt} = 23.44^\circ$ default).
   - Atmospheric tropospheric lapse rate ($-6.5^\circ\text{C} / 1000\text{m}$).
   - Continental thermal moderation (ocean heat capacity damping seasonal swings).
   - Zonal atmospheric circulation cells (Hadley, Ferrel, Polar) and prevailing winds (Trade Winds & Westerlies).
   - Orographic precipitation and leeward mountain rain shadows.

6. **Whittaker / Holdridge Biome Classification**:
   - Discrete ecological biomes: *Tropical Rainforest*, *Tropical Seasonal Forest*, *Savanna*, *Hot Desert*, *Cold Desert*, *Temperate Steppe*, *Temperate Forest*, *Temperate Rainforest*, *Boreal Taiga*, *Tundra*, *Alpine Highland*, *Glacial Ice Sheet*, *Wetlands*, *Coastal Coral Shelves*, and *Deep Ocean*.

7. **10 Interactive Scientific Visualization Modes**:
   - `Natural` (True color realistic biomes, alpine snow, ocean depths, day/night terminator)
   - `Elevation` (Hypsometric tinting with bathymetric blues to alpine peaks)
   - `Thermal` (Diverging scientific temperature scale $-45^\circ\text{C}$ to $+45^\circ\text{C}$)
   - `Rainfall` (Arid sand to deep storm indigo precipitation)
   - `Biomes` (Categorical ecological ecosystem classification)
   - `Moisture` (Aridity / potential evapotranspiration index)
   - `Slope` (Terrain gradient angles in degrees)
   - `Tectonics` (Lithospheric plates and fault boundaries)
   - `Bathymetry` (Continental shelves and abyssal ocean trenches)
   - `Contours` (Topographic elevation isolines)

8. **Interactive 3D Planet Viewer**:
   - Three.js WebGL rendering with Fresnel atmosphere rim glow and procedural clouds.
   - Orbital rotation, zoom, pan, daylight cycle toggle.
   - Surface hover inspection and click-to-pin coordinate raycaster.

9. **Environmental Simulation Scenarios**:
   - Global Temperature Warming (+8°C) / Cooling (-15°C snowball).
   - Marine Transgression (Sea level +0.18).
   - Megadrought (-50% precipitation).
   - Extreme Axial Tilt (42° high obliquity).

10. **Export & Reproducibility**:
    - Project configuration JSON.
    - Equirectangular 2D heightmap & surface map PNG exports.
    - Printable scientific HTML dossier.

---

## Running the Application

### 1. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Scientific Validation Tests
```bash
npm test
```
Runs the 10 automated scientific and mathematical validation tests.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.
