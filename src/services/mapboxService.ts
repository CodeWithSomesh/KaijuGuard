import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function initMapbox3D(
  container: HTMLElement,
  center: [number, number],
  zoom: number,
  onMove: (center: [number, number], zoom: number) => void
): mapboxgl.Map {
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        theme: 'monochrome'
      }
    },
    center: [center[1], center[0]],
    zoom,
    pitch: 45,
    bearing: -17.6,
    antialias: true,
  });

  map.on('style.load', () => {
    const layers = map.getStyle().layers;
    const labelLayerId = layers?.find(
      (l) => l.type === 'symbol' && (l.layout as any)?.['text-field']
    )?.id;

    if (!map.getSource('composite')) return;

    map.addLayer(
      {
        id: 'add-3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6,
        },
      },
      labelLayerId
    );
  });

  map.on('movestart', () => { (map as any)._isMovingFromUser = true; });
  map.on('moveend', () => {
    if ((map as any)._isMovingFromUser) {
      (map as any)._isMovingFromUser = false;
      const c = map.getCenter();
      onMove([c.lat, c.lng], map.getZoom());
    }
  });

  return map;
}

export function syncMapbox3D(map: mapboxgl.Map, center: [number, number], zoom: number): void {
  (map as any)._isMovingFromUser = false;
  map.easeTo({
    center: [center[1], center[0]],
    zoom,
    duration: 800,
  });
}