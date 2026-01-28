# Custom Image Mapbox

This demo mirrors the Arc site’s **Campus Tour** section: an image-based campus map with clickable amenity markers and a grid of amenity cards. Behavior matches Arc’s `CampusMap` / `CampusTour` components.

## Dependencies

**None.** No npm packages or build step. Open `index.html` in a browser or serve this folder with any static server.

- Arc’s **Location** section uses `mapbox-gl` for the real Mapbox map; this demo does **not**. The campus tour on Arc is a custom image map (PNG + pan/zoom + markers), so no Mapbox token or SDK is required here.
- All assets (map image, amenity images, icons) live in this folder under `images/`. Fonts in `style.css` point to `../../public/fonts/` for when the repo is served from the project root; if you open the file directly, the page falls back to system fonts.

## Behavior (matches Arc)

- **Click an amenity card** → page scrolls to the map, that marker is highlighted, and on mobile the map centers on that amenity.
- **Click a map marker** → page scrolls to the corresponding amenity card and highlights it (longer highlight on mobile).
- Map supports pan, pinch-zoom, and zoom +/- buttons; markers use the same pixel positions as Arc’s `amenityPixelPositions`.
