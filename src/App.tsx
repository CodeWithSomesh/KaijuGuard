"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Drone, DroneStatus, Survivor, TacticalLog, ChargingStation, Obstacle } from './types';
import {
  Activity,
  Battery,
  Cpu,
  Map as MapIcon,
  Navigation,
  Radio,
  Shield,
  AlertTriangle,
  Terminal,
  Zap,
  Target,
  Users,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Globe,
  Package,
  BarChart3,
  Search,
  Info,
  ShieldAlert,
  CloudLightning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { getTacticalAnalysis } from './services/adkService';
import { Map, Marker, Overlay, ZoomControl } from 'pigeon-maps';
import { DisasterModel, DroneAgent, SurvivorAgent } from './simulation/engine';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createRoot } from 'react-dom/client';
import './services/mapboxService';

const MALAYSIA_STATES = [
  { name: "Perlis", lat: 6.4444, lng: 100.2048 },
  { name: "Kedah", lat: 6.1184, lng: 100.3686 },
  { name: "Penang", lat: 5.4141, lng: 100.3288 },
  { name: "Perak", lat: 4.5921, lng: 101.0901 },
  { name: "Kelantan", lat: 6.1254, lng: 102.2386 },
  { name: "Terengganu", lat: 5.3117, lng: 103.1324 },
  { name: "Pahang", lat: 3.8126, lng: 103.3256 },
  { name: "Selangor", lat: 3.0738, lng: 101.5183 },
  { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 },
  { name: "Negeri Sembilan", lat: 2.7258, lng: 101.9424 },
  { name: "Malacca", lat: 2.1896, lng: 102.2501 },
  { name: "Johor", lat: 1.4854, lng: 103.7618 },
  { name: "Sabah", lat: 5.9788, lng: 116.0753 },
  { name: "Sarawak", lat: 1.5533, lng: 110.3592 },
];

const CHARGING_STATIONS: ChargingStation[] = [
  { id: 'CS-01', name: 'KL Relay', position: { x: 3.1390, y: 101.6869 }, capacity: 4, activeUnits: 0 },
  { id: 'CS-02', name: 'Sabah Relay', position: { x: 5.9788, y: 116.0753 }, capacity: 4, activeUnits: 0 },
];

const GLOBAL_REGIONS: Record<string, { lat: number, lng: number, zoom: number, states: { name: string, lat: number, lng: number }[], stations: ChargingStation[] }> = {
  "Malaysia": {
    lat: 4.2105, lng: 101.9758, zoom: 6,
    states: [
      { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 },
      { name: "Sabah", lat: 5.9788, lng: 116.0753 },
      { name: "Sarawak", lat: 1.5533, lng: 110.3592 },
      { name: "Penang", lat: 5.4141, lng: 100.3288 },
      { name: "Johor", lat: 1.4854, lng: 103.7618 },
    ],
    stations: [
      { id: 'CS-MY-01', name: 'KL Relay', position: { x: 3.1390, y: 101.6869 }, capacity: 4, activeUnits: 0 },
      { id: 'CS-MY-02', name: 'Sabah Relay', position: { x: 5.9788, y: 116.0753 }, capacity: 4, activeUnits: 0 },
    ]
  },
  "Japan": {
    lat: 36.2048, lng: 138.2529, zoom: 5,
    states: [
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Osaka", lat: 34.6937, lng: 135.5023 },
      { name: "Hokkaido", lat: 43.0642, lng: 141.3469 },
      { name: "Fukuoka", lat: 33.5904, lng: 130.4017 },
      { name: "Nagoya", lat: 35.1815, lng: 136.9066 },
      { name: "Hiroshima", lat: 34.3853, lng: 132.4553 },
    ],
    stations: [
      { id: 'CS-JP-01', name: 'Tokyo Hub', position: { x: 35.6762, y: 139.6503 }, capacity: 6, activeUnits: 0 },
      { id: 'CS-JP-02', name: 'Osaka Hub', position: { x: 34.6937, y: 135.5023 }, capacity: 4, activeUnits: 0 },
    ]
  },
  "USA": {
    lat: 37.0902, lng: -95.7129, zoom: 4,
    states: [
      { name: "Indianapolis", lat: 39.7684, lng: -86.1581 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "New York", lat: 40.7128, lng: -74.0060 },
      { name: "Miami", lat: 25.7617, lng: -80.1918 },
      { name: "Seattle", lat: 47.6062, lng: -122.3321 },
      { name: "Chicago", lat: 41.8781, lng: -87.6298 },
      { name: "Houston", lat: 29.7604, lng: -95.3698 },
      { name: "Denver", lat: 39.7392, lng: -104.9903 },
      { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
    ],
    stations: [
      { id: 'CS-US-01', name: 'Indy Relay', position: { x: 39.7684, y: -86.1581 }, capacity: 5, activeUnits: 0 },
      { id: 'CS-US-02', name: 'LA Hub', position: { x: 34.0522, y: -118.2437 }, capacity: 8, activeUnits: 0 },
      { id: 'CS-US-03', name: 'NY Hub', position: { x: 40.7128, y: -74.0060 }, capacity: 8, activeUnits: 0 },
    ]
  },
  "Brazil": {
    lat: -14.2350, lng: -51.9253, zoom: 4,
    states: [
      { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
      { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
      { name: "Brasília", lat: -15.7975, lng: -47.8919 },
    ],
    stations: [
      { id: 'CS-BR-01', name: 'SP Relay', position: { x: -23.5505, y: -46.6333 }, capacity: 5, activeUnits: 0 },
    ]
  },
  "Australia": {
    lat: -25.2744, lng: 133.7751, zoom: 4,
    states: [
      { name: "Sydney", lat: -33.8688, lng: 151.2093 },
      { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
      { name: "Perth", lat: -31.9505, lng: 115.8605 },
    ],
    stations: [
      { id: 'CS-AU-01', name: 'Sydney Hub', position: { x: -33.8688, y: 151.2093 }, capacity: 6, activeUnits: 0 },
    ]
  },
  "India": {
    lat: 20.5937, lng: 78.9629, zoom: 5,
    states: [
      { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
      { name: "Delhi", lat: 28.6139, lng: 77.2090 },
      { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
      { name: "Chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
      { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    ],
    stations: [
      { id: 'CS-IN-01', name: 'Mumbai Hub', position: { x: 19.0760, y: 72.8777 }, capacity: 6, activeUnits: 0 },
      { id: 'CS-IN-02', name: 'Delhi Hub', position: { x: 28.6139, y: 77.2090 }, capacity: 6, activeUnits: 0 },
    ]
  },
  "UK": {
    lat: 55.3781, lng: -3.4360, zoom: 6,
    states: [
      { name: "London", lat: 51.5074, lng: -0.1278 },
      { name: "Manchester", lat: 53.4808, lng: -2.2426 },
      { name: "Edinburgh", lat: 55.9533, lng: -3.1883 },
    ],
    stations: [
      { id: 'CS-UK-01', name: 'London Hub', position: { x: 51.5074, y: -0.1278 }, capacity: 5, activeUnits: 0 },
    ]
  },
};

const GLOBAL_LOCATIONS = Object.entries(GLOBAL_REGIONS).map(([name, data]) => ({
  name,
  lat: data.lat,
  lng: data.lng,
  zoom: data.zoom,
  region: name === "Malaysia" ? "SE Asia" : name === "Japan" ? "East Asia" : name === "USA" ? "North America" : name === "Brazil" ? "South America" : name === "Australia" ? "Oceania" : name === "India" ? "South Asia" : "Europe"
}));

const MAPBOX_STYLE_MAP: Record<string, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  hybrid: 'mapbox://styles/mapbox/satellite-streets-v12',
  tactical: 'mapbox://styles/mapbox/streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
};

function MapGroup({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div>{children}</div>;
}

function MapboxView({
  center,
  zoom,
  mapType,
  drones,
  survivors,
  obstacles,
  onDroneClick,
  onMove,
  renderContextMenu,
}: {
  center: [number, number];
  zoom: number;
  mapType: string;
  drones: Drone[];
  survivors: Survivor[];
  obstacles: Obstacle[];
  onDroneClick: (droneId: string, pos: { x: number; y: number }) => void;
  onMove: (center: [number, number], zoom: number) => void;
  renderContextMenu: (droneId: string, pos: { x: number; y: number }, container: HTMLElement, onClose: () => void) => void;
}) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const isSyncing = useRef(false);
  const markerMapRef = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map());
  const rootMapRef = useRef<globalThis.Map<string, ReturnType<typeof createRoot>>>(new globalThis.Map());

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      style: MAPBOX_STYLE_MAP[mapType] ?? MAPBOX_STYLE_MAP.dark,
      config: { basemap: { theme: 'monochrome' } },
      center: [center[1], center[0]],
      zoom,
      pitch: 45,
      bearing: -17.6,
      container: 'mapbox-3d-container',
      antialias: true,
    });

     mapRef.current.on('style.load', () => {
      // Inject popup styles
      if (!document.getElementById('mapbox-popup-style')) {
        const s = document.createElement('style');
        s.id = 'mapbox-popup-style';
        s.textContent = `
          .mapboxgl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          .mapboxgl-popup-tip { border-top-color: rgba(0,255,136,0.3) !important; border-bottom-color: rgba(0,255,136,0.3) !important; }
          .mapboxgl-popup-close-button {
            color: #00ff88 !important;
            font-size: 14px !important;
            font-family: 'Courier New', monospace !important;
            font-weight: bold !important;
            padding: 4px 8px !important;
            background: rgba(0,0,0,0.8) !important;
            border: 1px solid rgba(0,255,136,0.3) !important;
            border-radius: 0 !important;
            top: 6px !important;
            right: 6px !important;
            line-height: 1 !important;
          }
          .mapboxgl-popup-close-button:hover { background: rgba(0,255,136,0.1) !important; }
        `;
        document.head.appendChild(s);
      }

      // 3D terrain
      mapRef.current!.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14,
      });
      mapRef.current!.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // 3D buildings for ALL styles including satellite
      if (!mapRef.current!.getLayer('add-3d-buildings')) {
        const layers = mapRef.current!.getStyle().layers;
        const labelLayerId = layers.find(
          (l) => l.type === 'symbol' && (l.layout as any)?.['text-field']
        )?.id;

        if (mapRef.current!.getSource('composite')) {
          mapRef.current!.addLayer({
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#00ff88',
                '#aaa'
              ],
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
              'fill-extrusion-opacity': 0.7,
            },
          }, labelLayerId);
        }
      }

      // Hover highlight state
      let hoveredBuildingId: string | number | null = null;
      mapRef.current!.on('mousemove', 'add-3d-buildings', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBuildingId !== null) {
            mapRef.current!.setFeatureState(
              { source: 'composite', sourceLayer: 'building', id: hoveredBuildingId },
              { hover: false }
            );
          }
          hoveredBuildingId = e.features[0].id ?? null;
          if (hoveredBuildingId !== null) {
            mapRef.current!.setFeatureState(
              { source: 'composite', sourceLayer: 'building', id: hoveredBuildingId },
              { hover: true }
            );
          }
          mapRef.current!.getCanvas().style.cursor = 'pointer';
        }
      });

      mapRef.current!.on('mouseleave', 'add-3d-buildings', () => {
        if (hoveredBuildingId !== null) {
          mapRef.current!.setFeatureState(
            { source: 'composite', sourceLayer: 'building', id: hoveredBuildingId },
            { hover: false }
          );
        }
        hoveredBuildingId = null;
        mapRef.current!.getCanvas().style.cursor = '';
      });

      // Click for building info — query both building and poi layers
      mapRef.current!.on('click', 'add-3d-buildings', (e) => {
        if (!e.features || e.features.length === 0) return;
        const f = e.features[0].properties;

        // Also query nearby POI for name/category
        const poiFeatures = mapRef.current!.queryRenderedFeatures(e.point, {
          layers: ['poi-label']
        });
        const poi = poiFeatures[0]?.properties;

        const row = (label: string, val: any) =>
          val ? `<div style="display:flex;justify-content:space-between;gap:12px;padding:2px 0;border-bottom:1px solid rgba(0,255,136,0.1)"><span style="opacity:0.5">${label}</span><span style="color:#fff">${val}</span></div>` : '';

        const floors = f?.height ? Math.round(Number(f.height) / 3.5) : null;
        const category = poi?.category_en || poi?.class || poi?.type || null;
        const name = poi?.name || null;

        new mapboxgl.Popup({ closeButton: true, maxWidth: '240px', className: 'kaiju-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:'Courier New',monospace;font-size:11px;color:#00ff88;background:#000000;padding:10px 12px;border:1px solid rgba(0,255,136,0.3);min-width:200px;letter-spacing:0.03em;">
              <div style="font-weight:bold;margin-bottom:8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid rgba(0,255,136,0.2);padding-bottom:6px;">⬡ Structure Data</div>
              ${row('Name', name)}
              ${row('Category', category)}
              ${row('Type', f?.type)}
              ${row('Height', f?.height ? `${f.height}m` : null)}
              ${row('Est. Floors', floors)}
              ${row('Min Height', f?.min_height ? `${f.min_height}m` : null)}
              ${row('Underground', f?.underground === 'true' ? 'Yes' : null)}
            </div>
          `)
          .addTo(mapRef.current!);
      });
    });

    return () => {
      markerMapRef.current.forEach(m => m.remove());
      rootMapRef.current.forEach(r => r.unmount());
      markerMapRef.current.clear();
      rootMapRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync map style when mapType changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(MAPBOX_STYLE_MAP[mapType] ?? MAPBOX_STYLE_MAP.dark);
  }, [mapType]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const onMoveEnd = () => {
      if (isSyncing.current) return;
      const c = map.getCenter();
      onMove([c.lat, c.lng], map.getZoom());
    };
    map.on('moveend', onMoveEnd);
    return () => { map.off('moveend', onMoveEnd); };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    isSyncing.current = true;
    mapRef.current.easeTo({
      center: [center[1], center[0]],
      zoom,
      duration: 1000,
    });
    const timer = setTimeout(() => { isSyncing.current = false; }, 1100);
    return () => clearTimeout(timer);
  }, [center, zoom]);

  // Render markers for drones, survivors, obstacles
  useEffect(() => {
    if (!mapRef.current) return;

    const currentIds = new Set([
      ...drones.map(d => `drone-${d.id}`),
      ...survivors.map(s => `survivor-${s.id}`),
      ...obstacles.map(o => `obs-${o.id}`),
    ]);

    // Remove stale markers
    markerMapRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        rootMapRef.current.get(id)?.unmount();
        markerMapRef.current.delete(id);
        rootMapRef.current.delete(id);
      }
    });

    // Drones — update position only if already exists
    drones.forEach(drone => {
      const id = `drone-${drone.id}`;
      const existing = markerMapRef.current.get(id);
      if (existing) {
        existing.setLngLat([drone.position.y, drone.position.x]);
        return;
      }
      const el = document.createElement('div');
      el.style.cssText = 'cursor:pointer;';
      const root = createRoot(el);
      rootMapRef.current.set(id, root);
      root.render(
        <div className="flex flex-col items-center cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 translate-y-[2px] bg-black/40 blur-[1px] transform rotate-45" />
            <div className={cn("w-7 h-7 flex items-center justify-center bg-black/90 relative z-10 transform rotate-45 border transition-all duration-300", drone.battery < 15 ? "border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]", drone.status === DroneStatus.SCANNING && "animate-pulse")}>
              <div className="-rotate-45 flex items-center justify-center w-full h-full">
                {drone.status === DroneStatus.IDLE
                  ? <Shield className={cn("w-3.5 h-3.5", drone.battery < 15 ? "text-red-500" : "text-[#00ff88]")} />
                  : <Navigation className={cn("w-3.5 h-3.5", drone.battery < 15 ? "text-red-500" : "text-[#00ff88]")} />}
              </div>
            </div>
            <div className={cn("absolute -inset-3 border border-dotted rounded-full animate-[spin_4s_linear_infinite] z-0 opacity-60", drone.battery < 15 ? "border-red-500" : "border-[#00ff88]")} />
            <div className={cn("absolute -inset-2 border-2 border-t-transparent border-b-transparent rounded-full animate-[spin_8s_linear_infinite_reverse] z-0 opacity-40", drone.battery < 15 ? "border-red-500" : "border-[#00ff88]")} />
          </div>
          <span className="text-xs font-bold bg-black/80 px-1 mt-1 border border-terminal-text/20 shadow-md z-20">{drone.id}</span>
        </div>
      );
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([drone.position.y, drone.position.x])
        .addTo(mapRef.current!);

      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        const lngLat = marker.getLngLat();
        onDroneClick(drone.id, { x: lngLat.lat, y: lngLat.lng });
        document.querySelectorAll('.drone-menu-popup').forEach(p => p.remove());
        const container = document.createElement('div');
        const popup = new mapboxgl.Popup({ closeButton: false, anchor: 'top', offset: 20 })
          .setLngLat(lngLat)
          .setDOMContent(container)
          .addTo(mapRef.current!);
        popup.getElement().classList.add('drone-menu-popup');
        renderContextMenu(drone.id, { x: lngLat.lat, y: lngLat.lng }, container, () => { popup.remove(); });
      });

      markerMapRef.current.set(id, marker);
    });

    // Survivors — only create once, they don't move
    survivors.forEach(s => {
      const id = `survivor-${s.id}`;
      if (markerMapRef.current.has(id)) return;
      const el = document.createElement('div');
      const root = createRoot(el);
      rootMapRef.current.set(id, root);
      root.render(
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center">
          <div className="w-4 h-4 bg-red-600 rotate-45 flex items-center justify-center border border-white/40 shadow-lg">
            <Users className="w-2 h-2 text-white -rotate-45" />
          </div>
          <span className="text-xs font-bold text-red-500 bg-black/80 px-1 mt-1">SOS</span>
        </motion.div>
      );
      markerMapRef.current.set(id, new mapboxgl.Marker({ element: el, anchor: 'top' })
        .setLngLat([s.lng, s.lat])
        .addTo(mapRef.current!));
    });

    // Obstacles — only create once, they don't move
    obstacles.forEach(obs => {
      const id = `obs-${obs.id}`;
      if (markerMapRef.current.has(id)) return;
      const el = document.createElement('div');
      const root = createRoot(el);
      rootMapRef.current.set(id, root);
      root.render(
        <div className="relative flex items-center justify-center pointer-events-none">
          <div className={cn("rounded-full border-2 flex items-center justify-center", obs.type === "NO_FLY_ZONE" ? "bg-alert/10 border-alert/40" : "bg-warning/10 border-warning/40")} style={{ width: 80, height: 80 }}>
            <div className="flex flex-col items-center">
              {obs.type === "NO_FLY_ZONE" ? <ShieldAlert className="w-3 h-3 text-alert" /> : <CloudLightning className="w-3 h-3 text-warning" />}
              <span className="text-[6px] font-bold uppercase tracking-tighter opacity-60">{obs.type === "NO_FLY_ZONE" ? "NFZ" : "HAZARD"}</span>
            </div>
          </div>
        </div>
      );
      markerMapRef.current.set(id, new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([obs.position.y, obs.position.x])
        .addTo(mapRef.current!));
    });

  }, [drones, survivors, obstacles]);

  return <div id="mapbox-3d-container" style={{ width: '100%', height: '100%' }} />;
}

function DroneContextMenu({
  contextMenu,
  model,
  mapCenter,
  addLog,
  onClose,
}: {
  contextMenu: { droneId: string; pos: { x: number; y: number } };
  model: DisasterModel;
  mapCenter: [number, number];
  addLog: (msg: string, type?: any) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-black/95 border border-terminal-text/30 p-1 rounded shadow-2xl backdrop-blur-md min-w-[120px] z-[100] font-mono"
    >
      <div className="text-xs uppercase opacity-40 px-2 py-1 border-b border-terminal-text/10 mb-1">
        Unit {contextMenu.droneId} Actions
      </div>
      <button
        className="w-full text-left px-2 py-1.5 text-sm font-semibold hover:bg-terminal-text/20 transition-colors uppercase font-bold flex items-center gap-2"
        onClick={() => {
          const droneAgent = model.agents.find(a => a.id === contextMenu.droneId) as DroneAgent;
          if (droneAgent) {
            // Manual dispatch to current map center
            droneAgent.status = DroneStatus.DISPATCHED;
            droneAgent.setTarget({ x: mapCenter[0], y: mapCenter[1] }, model);
            addLog(`Manual dispatch command sent to ${contextMenu.droneId} to coordinates ${mapCenter[0].toFixed(2)}, ${mapCenter[1].toFixed(2)}`, "INFO");
          }
          onClose();
        }}
      >
        <Target className="w-3 h-3" /> Manual Dispatch
      </button>
      <button
        className="w-full text-left px-2 py-1.5 text-sm font-semibold hover:bg-terminal-text/20 transition-colors uppercase font-bold flex items-center gap-2"
        onClick={() => {
          const droneAgent = model.agents.find(a => a.id === contextMenu.droneId) as DroneAgent;
          if (droneAgent) {
            droneAgent.status = DroneStatus.SCANNING;
            droneAgent.target = null;
            droneAgent.path = [];
            addLog(`Scanning protocol initiated for ${contextMenu.droneId}`, "INFO");
          }
          onClose();
        }}
      >
        <Radio className="w-3 h-3" /> Scan Area
      </button>
      <button
        className="w-full text-left px-2 py-1.5 text-sm font-semibold hover:bg-terminal-text/20 transition-colors uppercase font-bold flex items-center gap-2 text-hazard"
        onClick={() => {
          const droneAgent = model.agents.find(a => a.id === contextMenu.droneId) as DroneAgent;
          if (droneAgent && model.stations.length > 0) {
            const nearest = model.stations.reduce((prev, curr) => {
              const distPrev = Math.sqrt(Math.pow(droneAgent.pos.x - prev.position.x, 2) + Math.pow(droneAgent.pos.y - prev.position.y, 2));
              const distCurr = Math.sqrt(Math.pow(droneAgent.pos.x - curr.position.x, 2) + Math.pow(droneAgent.pos.y - curr.position.y, 2));
              return distCurr < distPrev ? curr : prev;
            });
            droneAgent.status = DroneStatus.RETURNING;
            droneAgent.setTarget(nearest.position, model);
            addLog(`Return to base command sent to ${contextMenu.droneId}. Heading to ${nearest.name}.`, "WARNING");
          }
          onClose();
        }}
      >
        <RotateCcw className="w-3 h-3" /> Return to Base
      </button>
      <button
        className="w-full text-center mt-1 py-1 text-xs opacity-50 hover:opacity-100"
        onClick={onClose}
      >
        Close
      </button>
    </motion.div>
  );
}

export default function App() {
  const [model, setModel] = useState<DisasterModel>(() => {
    const m = new DisasterModel(120, 10);
    const initialRegion = GLOBAL_REGIONS["Malaysia"];
    m.stations = initialRegion.stations;

    // Generate initial obstacles for the default region
    const obstacles: Obstacle[] = [];
    initialRegion.states.forEach((state, i) => {
      if (i % 2 === 0) {
        obstacles.push({
          id: `OBS-INIT-${i}`,
          position: {
            x: state.lat + (Math.random() - 0.5) * 1.0,
            y: state.lng + (Math.random() - 0.5) * 1.0
          },
          radius: 0.2,
          type: "NO_FLY_ZONE"
        });
      }
    });
    m.obstacles = obstacles;

    // Initial Drones for Malaysia
    initialRegion.states.forEach((s, i) => {
      m.addAgent(new DroneAgent(`DR-0${i + 1}`, { x: s.lat, y: s.lng }, `KaijuGuard-${s.name}`));
    });
    return m;
  });

  const [tick, setTick] = useState(0);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [survivors, setSurvivors] = useState<Survivor[]>([]);
  const [logs, setLogs] = useState<TacticalLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ droneId: string; pos: { x: number; y: number } } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.2105, 101.9758]);
  const [mapZoom, setMapZoom] = useState(6);
  const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'tactical' | 'terrain' | 'dark'>('dark');
  const [is3D, setIs3D] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'global' | 'risk'>('fleet');
  const [rightTab, setRightTab] = useState<'analytics' | 'logs'>('analytics');
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const terminalEndRef = useRef<HTMLDivElement>(null);  

  const getCurrentRegion = () => {
    let currentRegionName = "Malaysia";
    let minDist = Infinity;

    Object.entries(GLOBAL_REGIONS).forEach(([name, data]) => {
      const d = Math.sqrt(Math.pow(data.lat - mapCenter[0], 2) + Math.pow(data.lng - mapCenter[1], 2));
      if (d < minDist) {
        minDist = d;
        currentRegionName = name;
      }
    });
    return GLOBAL_REGIONS[currentRegionName];
  };

  // Helper to calculate pixel offset for lines
  const getPixelOffset = (from: [number, number], to: [number, number], zoom: number) => {
    const latRad = (lat: number) => lat * Math.PI / 180;
    const mercN = (lat: number) => Math.log(Math.tan((Math.PI / 4) + (latRad(lat) / 2)));

    const worldSize = 256 * Math.pow(2, zoom);

    const x1 = (from[1] + 180) * (worldSize / 360);
    const y1 = (worldSize / 2) - (worldSize * mercN(from[0]) / (2 * Math.PI));

    const x2 = (to[1] + 180) * (worldSize / 360);
    const y2 = (worldSize / 2) - (worldSize * mercN(to[0]) / (2 * Math.PI));

    return { dx: x2 - x1, dy: y2 - y1 };
  };

  const animateMap = (targetLat: number, targetLng: number, targetZoom: number) => {
    const startLat = mapCenter[0];
    const startLng = mapCenter[1];
    const startZoom = mapZoom;
    const duration = 2500;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);

      // Sleek cubic easing
      const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentLat = startLat + (targetLat - startLat) * ease(progress);
      const currentLng = startLng + (targetLng - startLng) * ease(progress);
      const currentZoom = startZoom + (targetZoom - startZoom) * ease(progress);

      setMapCenter([currentLat, currentLng]);
      setMapZoom(currentZoom);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Sync state with model
  useEffect(() => {
    setDrones(model.getDrones());
    setSurvivors(model.getSurvivors());
  }, [tick, model]);

  // Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      model.step();
      setTick(t => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, model]);

  const generateObstacles = (region: any) => {
    const obstacles: Obstacle[] = [];
    // Generate 4-6 random obstacles in the region
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const state = region.states[Math.floor(Math.random() * region.states.length)];
      obstacles.push({
        id: `OBS-${Math.random().toString(36).substr(2, 5)}`,
        position: {
          x: state.lat + (Math.random() - 0.5) * 2.0,
          y: state.lng + (Math.random() - 0.5) * 2.0
        },
        radius: 0.15 + Math.random() * 0.25, // ~15-40km
        type: Math.random() > 0.5 ? "NO_FLY_ZONE" : "WEATHER_HAZARD"
      });
    }
    return obstacles;
  };

  const handleReset = () => {
    const region = getCurrentRegion();
    const m = new DisasterModel(120, 10);
    m.stations = region.stations;
    m.obstacles = generateObstacles(region);

    // Spawn initial drones at the states of the current region
    region.states.forEach((s, i) => {
      m.addAgent(new DroneAgent(`DR-${i + 1}`, { x: s.lat, y: s.lng }, `KaijuGuard-${s.name}`));
    });

    setModel(m);
    setTick(0);
    setLogs([]);
    setSurvivors([]);
    addLog(`Simulation Reset. KaijuGuard Protocol Initialized for ${Object.keys(GLOBAL_REGIONS).find(k => GLOBAL_REGIONS[k] === region)} Sector.`, "INFO");
  };

  const simulateEarthquake = () => {
    const region = getCurrentRegion();
    const regionName = Object.keys(GLOBAL_REGIONS).find(k => GLOBAL_REGIONS[k] === region) || "Global";
    const state = region.states[Math.floor(Math.random() * region.states.length)];

    addLog(`ALERT: Earthquake detected in ${state.name}, ${regionName}!`, "CRITICAL");
    addLog(`COMMANDER: Deploying regional KaijuGuard response fleet to ${state.name} epicenter.`, "INFO");

    // Center map on epicenter
    animateMap(state.lat, state.lng, 8);

    // Update stations and obstacles for the current region
    model.stations = region.stations;
    model.obstacles = generateObstacles(region);

    // Clear old drones and spawn new ones for this region
    model.agents = model.agents.filter(a => !(a instanceof DroneAgent));
    model.schedule = model.schedule.filter(a => !(a instanceof DroneAgent));

    // Spawn drones from OTHER states in the region to converge on the epicenter
    const otherStates = region.states.filter(s => s.name !== state.name);
    const droneCount = 8; // Fixed count for consistency or variable

    for (let i = 0; i < droneCount; i++) {
      let startPos;
      if (otherStates.length > 0) {
        // Pick a random other state as starting point
        const sourceState = otherStates[i % otherStates.length];
        // Add some random jitter so they don't all start at the exact same point
        startPos = {
          x: sourceState.lat + (Math.random() - 0.5) * 0.2,
          y: sourceState.lng + (Math.random() - 0.5) * 0.2
        };
      } else {
        // Fallback to circle dispersion if only one state exists
        const angle = (i / droneCount) * Math.PI * 2;
        const radius = 1.0 + Math.random() * 1.5;
        startPos = {
          x: state.lat + Math.cos(angle) * radius,
          y: state.lng + Math.sin(angle) * radius
        };
      }

      const drone = new DroneAgent(
        `DR-${regionName.substring(0, 2)}-${i + 1}`,
        startPos,
        `KaijuGuard-${regionName}-${i + 1}`
      );
      drone.status = DroneStatus.DISPATCHED;
      drone.setTarget({ x: state.lat, y: state.lng }, model);
      model.addAgent(drone);
      addLog(`[DISPATCH] Drone ${drone.id} launched from ${otherStates.length > 0 ? 'remote sector' : 'perimeter'} towards ${state.name}.`, "INFO");
    }

    // Spawn survivors around epicenter
    for (let i = 0; i < 6; i++) {
      const s = new SurvivorAgent(`S-${Math.random().toString(36).substr(2, 5)}`, {
        x: state.lat + (Math.random() - 0.5) * 0.3,
        y: state.lng + (Math.random() - 0.5) * 0.3
      });
      model.addAgent(s);
    }

    // Trigger analysis to respond
    triggerAnalysis();
  };

  const handleStep = () => {
    model.step();
    setIsPlaying(false);
  };

  // Autonomous Logic Trigger
  useEffect(() => {
    const lowBatteryDrones = drones.filter(d => d.battery < 25 && d.status !== DroneStatus.RETURNING && d.status !== DroneStatus.CHARGING);
    if (lowBatteryDrones.length > 0) {
      triggerAnalysis();
    }
  }, [drones.some(d => d.battery < 25)]);

  const addLog = (message: string, type: TacticalLog['type'] = 'INFO', summary?: string, toolCall?: any) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      summary,
      toolCall
    }]);
  };

  const triggerAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    addLog("Initiating Tactical Analysis...", "INFO");

    const result = await getTacticalAnalysis(drones, survivors, logs);

    if (result.summary) {
      addLog("Analysis Complete", "INFO", result.summary);
    }

    if (result.toolCalls) {
      for (const call of result.toolCalls) {
        executeTool(call.name, call.args);
      }
    }

    setIsAnalyzing(false);
  };

  const executeTool = (name: string, args: any) => {
    addLog(`Executing Tool: ${name}`, "TOOL_CALL", undefined, { name, args });

    const droneAgents = model.agents.filter(a => a instanceof DroneAgent) as DroneAgent[];

    switch (name) {
      case 'broadcast_audio':
        const targetDrone = droneAgents.find(d => d.id === args.drone_id);
        if (targetDrone) {
          const message = args.message || "Rescue is on the way, stay put if safe";
          addLog(`[AUDIO BROADCAST] Drone ${targetDrone.id}: "${message}"`, "INFO");
          targetDrone.status = DroneStatus.BROADCASTING;
          setTimeout(() => {
            targetDrone.status = DroneStatus.SCANNING;
          }, 3000);
        }
        break;
      case 'manage_resources':
        droneAgents.forEach(d => {
          if (d.battery < 25 && d.status !== DroneStatus.RETURNING && d.status !== DroneStatus.CHARGING) {
            let nearest = CHARGING_STATIONS[0];
            let minDist = Infinity;
            CHARGING_STATIONS.forEach(s => {
              const dist = Math.sqrt(Math.pow(s.position.x - d.pos.x, 2) + Math.pow(s.position.y - d.pos.y, 2));
              if (dist < minDist) {
                minDist = dist;
                nearest = s;
              }
            });
            addLog(`Re-routing ${d.id} to ${nearest.name} (Low Battery: ${d.battery.toFixed(1)}%)`, "WARNING");
            d.status = DroneStatus.RETURNING;
            d.target = nearest.position;
          }
        });
        break;
      case 'dispatch_drone':
        const idleDrone = droneAgents.find(d => d.status === DroneStatus.IDLE || d.status === DroneStatus.SCANNING);
        if (idleDrone) {
          addLog(`[DISPATCH] Drone ${idleDrone.id} dispatched to survivor at ${args.target_lat_long.x.toFixed(4)}, ${args.target_lat_long.y.toFixed(4)}`, "INFO");
          idleDrone.status = DroneStatus.DISPATCHED;
          idleDrone.target = args.target_lat_long;
        }
        break;
      case 'detect_survivors':
        if (Math.random() > 0.4) {
          const drone = droneAgents.find(d => d.id === args.drone_id);
          if (drone) {
            const s = new SurvivorAgent(`S-${Math.random().toString(36).substr(2, 5)}`, {
              x: drone.pos.x + (Math.random() - 0.5) * 0.1,
              y: drone.pos.y + (Math.random() - 0.5) * 0.1
            });
            model.addAgent(s);
            addLog(`CRITICAL: ${s.type} detected by ${drone.id}!`, "CRITICAL");
          }
        }
        break;
      case 'map_zone':
        addLog(`Mapping zone at ${args.coordinates.lat}, ${args.coordinates.lng}`, "INFO");
        break;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-zinc-300 font-mono selection:bg-terminal-text selection:text-black">
      {/* Header */}
      <header className="h-16 border-b border-terminal-text/20 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-terminal-text/10 rounded flex items-center justify-center border border-terminal-text/30 overflow-hidden">
            <img src="/logo.png" alt="KaijuGuard Logo" className="w-full h-full object-cover opacity-90 mix-blend-screen" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-wider text-white uppercase">KaijuGuard Command</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400 font-bold">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> SYSTEM: ONLINE</span>
              <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> MESH: STABLE</span>
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> EDGE: ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-terminal-text/20 pl-4 ml-4">
          <div className="flex items-center gap-1 bg-black/40 border border-terminal-text/20 rounded p-1">
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-terminal-text/10 rounded transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 hover:bg-terminal-text/10 rounded transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleStep}
              className="p-1.5 hover:bg-terminal-text/10 rounded transition-colors"
              title="Step Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase opacity-40">Step Count</span>
            <span className="text-xs font-mono">{model.stepCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={simulateEarthquake}
            className="px-4 py-2 border border-alert/60 bg-alert/10 text-alert hover:bg-alert hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Simulate Earthquake
          </button>
          <div className="flex flex-col items-end">
            <span className="text-base font-semibold opacity-50 uppercase tracking-widest">Zone Coordinates</span>
            <span className="text-sm">4.2105° N, 101.9758° E</span>
          </div>
          <button
            onClick={triggerAnalysis}
            disabled={isAnalyzing}
            className={cn(
              "px-4 py-2 border border-terminal-text/40 hover:bg-terminal-text hover:text-black transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
              isAnalyzing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isAnalyzing ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Tactical Analysis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Tabbed Interface */}
        <aside className="w-96 border-r border-terminal-text/20 flex flex-col bg-black/40 relative">
          {/* Tabs Header */}
          <div className="flex border-b border-terminal-text/20 bg-black/60">
            {[
              { id: 'fleet', icon: Package, label: 'Fleet' },
              { id: 'global', icon: Globe, label: 'Global' },
              { id: 'risk', icon: BarChart3, label: 'Risk' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-4 flex flex-col items-center gap-2 transition-all relative group",
                  activeTab === tab.id ? "text-terminal-text" : "text-terminal-text/40 hover:text-terminal-text/70"
                )}
              >
                <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "animate-pulse")} />              <span className="text-sm uppercase font-bold tracking-wider">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-text shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'fleet' && (
                <motion.div
                  key="fleet"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold font-bold uppercase tracking-widest opacity-50">Active Units</h3>
                    <span className="text-base font-semibold px-1.5 py-0.5 border border-terminal-text/30 rounded">
                      {drones.length} ONLINE
                    </span>
                  </div>
                  {drones.map(drone => (
                    <motion.div
                      key={drone.id}
                      onClick={() => setSelectedDrone(drone.id === selectedDrone ? null : drone.id)}
                      className={cn(
                        "p-3 border border-terminal-text/10 rounded cursor-pointer transition-all hover:border-terminal-text/40",
                        selectedDrone === drone.id ? "bg-terminal-text/5 border-terminal-text/60" : "bg-black/20",
                        drone.battery < 15 && "border-alert/40 animate-pulse"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", drone.status === DroneStatus.SCANNING ? "bg-safe animate-pulse" : "bg-terminal-text")} />
                          <span className="text-xs font-bold">{drone.name}</span>
                        </div>
                        <span className="text-sm font-semibold opacity-60">#{drone.id}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-base font-semibold">
                          <span className="flex items-center gap-1 opacity-60"><Battery className="w-3 h-3" /> Charge</span>
                          <span className={cn(drone.battery < 15 ? "text-alert font-bold" : "text-terminal-text")}>
                            {drone.battery.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-terminal-text/10 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full", drone.battery < 15 ? "bg-alert" : "bg-terminal-text")}
                            initial={{ width: 0 }}
                            animate={{ width: `${drone.battery}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm font-semibold opacity-60">
                          <span className="flex items-center gap-1"><MapIcon className="w-3 h-3" /> {drone.position.x.toFixed(3)}, {drone.position.y.toFixed(3)}</span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {drone.status}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'global' && (
                <motion.div
                  key="global"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                >
                  <div className="mb-6 p-4 bg-terminal-text/5 border border-terminal-text/20 rounded">
                    <h3 className="text-xs font-bold uppercase mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Global Monitor
                    </h3>
                    <p className="text-base font-semibold opacity-60 leading-relaxed">
                      Select a sector to redeploy KaijuGuard assets. High-altitude transit will be initiated automatically.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {GLOBAL_LOCATIONS.map(loc => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            animateMap(loc.lat, loc.lng, loc.zoom);
                            addLog(`Global redeployment: Sector ${loc.name} selected.`, "INFO");
                          }}
                          className="w-full p-3 flex items-center justify-between border border-terminal-text/10 rounded hover:bg-terminal-text/10 hover:border-terminal-text/30 transition-all group"
                        >
                          <div className="flex flex-col items-start">
                          <span className="text-xs font-bold group-hover:text-terminal-text transition-colors">{loc.name}</span>
                          <span className="text-sm font-semibold opacity-40 uppercase tracking-tighter">{loc.region}</span>
                        </div>
                          <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'risk' && (
                <motion.div
                  key="risk"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
                >
                  <div className="p-4 border border-hazard/40 bg-hazard/5 rounded relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <h3 className="text-xs font-bold text-hazard uppercase mb-2">AI-Powered Analysis</h3>
                    <p className="text-sm text-hazard/80 leading-relaxed">
                      Risk scores calculated from real-time seismic data and historical patterns. Results may require verification.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm uppercase font-bold text-gray-300">
                        <span>Seismic Risk</span>
                        <span className="text-hazard">High (7.2)</span>
                      </div>
                      <div className="h-2 bg-terminal-text/10 rounded-full overflow-hidden">
                        <div className="h-full w-[72%] bg-hazard" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm uppercase font-bold text-gray-300">
                        <span>Population Density</span>
                        <span className="text-safe">Moderate</span>
                      </div>
                      <div className="h-2 bg-terminal-text/10 rounded-full overflow-hidden">
                        <div className="h-full w-[45%] bg-safe" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm uppercase font-bold text-gray-300">
                        <span>Infrastructure Vulnerability</span>
                        <span className="text-alert">Critical</span>
                      </div>
                      <div className="h-2 bg-terminal-text/10 rounded-full overflow-hidden">
                        <div className="h-full w-[88%] bg-alert" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-terminal-text/20 rounded bg-black/40">
                    <h4 className="text-base font-semibold font-bold uppercase mb-2 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Mitigation Strategy
                    </h4>
                    <ul className="text-sm font-semibold space-y-2 opacity-70 list-disc pl-4">
                      <li>Pre-position KaijuGuard units in high-risk coastal zones</li>
                      <li>Initiate low-latency mesh network redundancy</li>
                      <li>Alert local emergency response nodes</li>
                    </ul>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-terminal-text/20 bg-black/60 flex items-center justify-between text-xs opacity-40 uppercase tracking-widest">
            <span>KaijuGuard v1.0</span>
            <span>Last Sync: Just Now</span>
          </div>
        </aside>

        {/* Center: Tactical Map */}
        <section className="flex-1 relative bg-black grid-bg overflow-hidden flex flex-col" style={{ backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'screen' }}>
          <div className="scanline" />

          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="bg-black/80 border border-terminal-text/20 p-2 rounded backdrop-blur-sm">
              <div className="text-base font-semibold uppercase opacity-50 mb-1">Active Alerts</div>
              <div className="flex items-center gap-2 text-alert">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold">{survivors.length} DETECTIONS</span>
              </div>
            </div>

            <div className="bg-black/80 border border-terminal-text/20 p-2 rounded backdrop-blur-sm">
              <div className="text-base font-semibold uppercase opacity-50 mb-1">Map View</div>
              <select
                value={mapType}
                onChange={(e) => setMapType(e.target.value as any)}
                className="bg-black text-base font-semibold border border-terminal-text/30 rounded px-1 py-0.5 outline-none focus:border-terminal-text w-full mb-2"
              >
                <option value="dark">Dark (Mapbox Style)</option>
                <option value="hybrid">Hybrid (Labels)</option>
                <option value="satellite">Satellite (Pure)</option>
                <option value="tactical">Tactical (Roads)</option>
                <option value="terrain">Terrain (3D-ish)</option>
              </select>
              <div className="text-base font-semibold uppercase opacity-50 mb-1">Perspective</div>
              <button
                onClick={() => setIs3D(!is3D)}
                className={cn(
                  "w-full text-base font-semibold border border-terminal-text/30 rounded px-2 py-1 uppercase font-bold transition-colors",
                  is3D ? "bg-terminal-text text-black" : "bg-black text-terminal-text hover:bg-terminal-text/10"
                )}
              >
                {is3D ? "3D View" : "2D View"}
              </button>
            </div>
          </div>

          {/* Map Visualization */}
          <div
          className="flex-1 relative bg-zinc-900 overflow-hidden">
            {!is3D && isMounted && (
            <div className="w-full h-full">
              <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  onBoundsChanged={({ center, zoom }) => {
                    setMapCenter(center);
                    setMapZoom(zoom);
                  }}
                  onClick={() => setContextMenu(null)}
                  dprs={[1, 2]}
                  metaWheelZoom={true}
                  provider={(x, y, z) => {
                    if (mapType === 'dark') {
                      return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
                    }
                    const lyrs = mapType === 'satellite' ? 's' : mapType === 'hybrid' ? 'y' : mapType === 'terrain' ? 'p' : 'm';
                    return `https://mt1.google.com/vt/lyrs=${lyrs}&x=${x}&y=${y}&z=${z}`;
                  }}
                >
                  <ZoomControl />

                  {/* City Labels */}
                  {getCurrentRegion().states.map(state => (
                    // @ts-ignore
                    <Overlay key={`label-${state.name}`} anchor={[state.lat, state.lng]}>
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-1 h-1 bg-white/40 rounded-full mb-1" />
                        <span className="text-base font-semibold font-display font-bold text-white/60 uppercase tracking-widest whitespace-nowrap drop-shadow-md">
                          {state.name}
                        </span>
                      </div>
                    </Overlay>
                  ))}

                  {/* History Lines */}
                  {drones.map(drone => (
                    <MapGroup key={`history-group-${drone.id}`}>
                      {drone.history.slice(1).map((pos, idx) => {
                        const prevPos = drone.history[idx];
                        const offset = getPixelOffset([prevPos.x, prevPos.y], [pos.x, pos.y], mapZoom);
                        return (
                          // @ts-ignore
                          <Overlay key={`history-${drone.id}-${idx}`} anchor={[prevPos.x, prevPos.y]}>
                            <svg className="overflow-visible pointer-events-none absolute" style={{ width: 1, height: 1 }}>
                              <line
                                x1="0"
                                y1="0"
                                x2={offset.dx}
                                y2={offset.dy}
                                stroke="#00ff88"
                                strokeWidth="1.5"
                                strokeOpacity="0.5"
                                className="filter drop-shadow-[0_0_2px_#00ff88]"
                              />
                            </svg>
                          </Overlay>
                        );
                      })}
                    </MapGroup>
                  ))}

                  {/* Obstacles */}
                  {model.obstacles.map(obs => (
                    // @ts-ignore
                    <Overlay key={obs.id} anchor={[obs.position.x, obs.position.y]}>
                      <div className="relative flex items-center justify-center pointer-events-none">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "rounded-full border-2 flex items-center justify-center",
                            obs.type === "NO_FLY_ZONE" ? "bg-alert/10 border-alert/40" : "bg-warning/10 border-warning/40"
                          )}
                          style={{
                            width: obs.radius * 200 * (mapZoom / 5),
                            height: obs.radius * 200 * (mapZoom / 5)
                          }}
                        >
                          <div className="flex flex-col items-center">
                            {obs.type === "NO_FLY_ZONE" ? <ShieldAlert className="w-3 h-3 text-alert" /> : <CloudLightning className="w-3 h-3 text-warning" />}
                            <span className="text-[6px] font-bold uppercase tracking-tighter opacity-60">
                              {obs.type === "NO_FLY_ZONE" ? "NFZ" : "HAZARD"}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </Overlay>
                  ))}

                  {/* Trajectory Paths (A* Waypoints) */}
                  {drones.filter(d => d.status === DroneStatus.DISPATCHED || d.status === DroneStatus.RETURNING).map(drone => {
                    const droneAgent = model.agents.find(a => a.id === drone.id) as DroneAgent;
                    if (!droneAgent || droneAgent.path.length === 0) return null;

                    const fullPath = [{ x: drone.position.x, y: drone.position.y }, ...droneAgent.path];

                    return (
                      <MapGroup key={`path-group-${drone.id}`}>
                        {fullPath.slice(1).map((pos, idx) => {
                          const prevPos = fullPath[idx];
                          const offset = getPixelOffset([prevPos.x, prevPos.y], [pos.x, pos.y], mapZoom);
                          return (
                            // @ts-ignore
                            <Overlay key={`path-${drone.id}-${idx}`} anchor={[prevPos.x, prevPos.y]}>
                              <svg className="overflow-visible pointer-events-none absolute" style={{ width: 1, height: 1 }}>
                                <line
                                  x1="0"
                                  y1="0"
                                  x2={offset.dx}
                                  y2={offset.dy}
                                  stroke={drone.status === DroneStatus.RETURNING ? "#f27d26" : "#00ff88"}
                                  strokeWidth="2"
                                  strokeDasharray="6 6"
                                  strokeOpacity={1 - (idx / fullPath.length) * 0.6}
                                  className="animate-[dash_1s_linear_infinite] filter drop-shadow-[0_0_5px_currentColor]"
                                />
                              </svg>
                            </Overlay>
                          );
                        })}
                      </MapGroup>
                    );
                  })}

                  {/* Charging Stations */}
                  {model.stations.map(s => (
                    // @ts-ignore
                    <Overlay key={s.id} anchor={[s.position.x, s.position.y]} offset={[8, 8]}>
                      <div className="flex flex-col items-center group">
                        <div className="w-4 h-4 border border-terminal-text bg-black/60 flex items-center justify-center shadow-lg">
                          <Zap className="w-2 h-2 text-terminal-text" />
                        </div>
                        <span className="text-xs uppercase bg-black/80 px-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {s.name}
                        </span>
                      </div>
                    </Overlay>
                  ))}

                  {/* Drones */}
                  {drones.map(drone => (
                    // @ts-ignore
                    <Overlay key={drone.id} anchor={[drone.position.x, drone.position.y]} offset={[10, 10]}>
                      <div
                        className={cn(
                          "flex flex-col items-center cursor-pointer transition-all hover:scale-110",
                          selectedDrone === drone.id && "scale-125"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrone(drone.id);
                          setContextMenu({ droneId: drone.id, pos: drone.position });
                        }}
                      >
                        <div className="relative group">
                          {/* Tactical Diamond Frame */}
                          <div className="absolute inset-0 translate-y-[2px] translate-z-[-2px] bg-black/40 blur-[1px] transform rotate-45" />
                          
                          <div className={cn(
                            "w-7 h-7 flex items-center justify-center bg-black/90 relative z-10 transform rotate-45 border transition-all duration-300",
                            drone.battery < 15 ? "border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]",
                            drone.status === DroneStatus.SCANNING && "animate-pulse"
                          )}>
                            {/* Inner unrotated icon */}
                            <div className="-rotate-45 flex items-center justify-center w-full h-full">
                              {drone.status === DroneStatus.IDLE ? (
                                <Shield className={cn("w-3.5 h-3.5", drone.battery < 15 ? "text-red-500" : "text-[#00ff88]")} />
                              ) : (
                                <Navigation
                                  className={cn("w-3.5 h-3.5 drop-shadow-[0_0_4px_currentColor]", drone.battery < 15 ? "text-red-500" : "text-[#00ff88]")}
                                  style={{ transform: `rotate(${Math.atan2(drone.target.y - drone.position.y, drone.target.x - drone.position.x) * 180 / Math.PI + 90}deg)` }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Tactical Outer Rings */}
                          <div className={cn(
                            "absolute -inset-3 border border-dotted rounded-full animate-[spin_4s_linear_infinite] z-0 opacity-60",
                            drone.battery < 15 ? "border-red-500" : "border-[#00ff88]"
                          )} />
                          <div className={cn(
                            "absolute -inset-2 border-2 border-t-transparent border-b-transparent rounded-full animate-[spin_8s_linear_infinite_reverse] z-0 opacity-40",
                            drone.battery < 15 ? "border-red-500" : "border-[#00ff88]"
                          )} />
                        </div>
                        <span className="text-xs font-semibold font-bold bg-black/80 px-1 mt-1 border border-terminal-text/20 shadow-md z-20">
                          {drone.id}
                        </span>
                      </div>
                    </Overlay>
                  ))}

                  {/* Context Menu */}
                  {contextMenu && (
                    // @ts-ignore
                    <Overlay anchor={[contextMenu.pos.x, contextMenu.pos.y]} offset={[-20, 40]}>
                      <DroneContextMenu contextMenu={contextMenu} model={model} mapCenter={mapCenter} addLog={addLog} onClose={() => setContextMenu(null)} />
                    </Overlay>
                  )}

                  {/* Survivors */}
                  {survivors.map(s => (
                    // @ts-ignore
                    <Overlay key={s.id} anchor={[s.lat, s.lng]} offset={[10, 10]}>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-4 h-4 bg-red-600 rotate-45 flex items-center justify-center border border-white/40 shadow-lg">
                          <Users className="w-2 h-2 text-white -rotate-45" />
                        </div>
                        <span className="text-xs font-bold text-red-500 bg-black/80 px-1 mt-1">SOS</span>
                      </motion.div>
                    </Overlay>
                  ))}
                </Map>
              </div>
            )}

            {/* Mapbox 3D view */}
            {is3D && (
            <div className="absolute inset-0">
              <MapboxView
                center={mapCenter}
                zoom={mapZoom}
                mapType={mapType}
                drones={drones}
                survivors={survivors}
                obstacles={model.obstacles}
                renderContextMenu={(droneId, pos, container, onClose) => {
                  createRoot(container).render(
                    <DroneContextMenu
                      contextMenu={{ droneId, pos }}
                      model={model}
                      mapCenter={mapCenter}
                      addLog={addLog}
                      onClose={() => { onClose(); setContextMenu(null); }}
                    />
                  );
                }}
                
                onDroneClick={(droneId, pos) => {
                  setSelectedDrone(droneId);
                  setContextMenu({ droneId, pos });
                }}
                onMove={(center, zoom) => {
                  setMapCenter(center);
                  setMapZoom(zoom);
                }}
              />
            </div>
          )}
          </div>

        </section>

        {/* Right Sidebar: Analytics & Detections */}
        <aside className="w-[450px] border-l border-zinc-800 flex flex-col bg-black/60 relative z-20">
          <div className="flex border-b border-zinc-800 bg-black/80">
            <button
              onClick={() => setRightTab('analytics')}
              className={cn("flex-1 py-4 flex items-center justify-center gap-3 transition-all relative group",
                rightTab === 'analytics' ? "text-terminal-text" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Activity className={cn("w-5 h-5", rightTab === 'analytics' && "animate-pulse shadow-[0_0_15px_rgba(0,255,65,0.8)]")} />
              <span className="text-sm uppercase font-bold tracking-tighter">Real-time Analytics</span>
              {rightTab === 'analytics' && (
                <motion.div layoutId="rightTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-text shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setRightTab('logs')}
              className={cn("flex-1 py-4 flex items-center justify-center gap-3 transition-all relative group",
                rightTab === 'logs' ? "text-terminal-text" : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Terminal className="w-5 h-5" />
              <span className="text-sm uppercase font-bold tracking-tighter">Tactical Log</span>
              {rightTab === 'logs' && (
                <motion.div layoutId="rightTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-terminal-text shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-hidden p-4 flex flex-col relative w-full h-full">
            <div className="absolute inset-0 px-4 py-4 overflow-y-auto w-full custom-scrollbar">
              <AnimatePresence mode="wait">
                {rightTab === 'analytics' && (
                  <motion.div key="analytics" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    {/* Battery Trend */}
                    <div className="space-y-4">
                      <div className="text-sm uppercase opacity-70 flex items-center justify-between font-bold text-gray-300">
                        <span>Fleet Battery Avg</span>
                        <span className="text-terminal-text text-lg">{(drones.reduce((acc, d) => acc + d.battery, 0) / (drones.length || 1)).toFixed(1)}%</span>
                      </div>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={drones}>
                            <defs>
                              <linearGradient id="colorBatt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="battery" stroke="#00ff41" fillOpacity={1} fill="url(#colorBatt)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Survivor Detections */}
                    <div className="space-y-3">
                      <div className="text-sm uppercase opacity-70 flex items-center justify-between font-bold text-gray-300">
                        <span>Survivor Detections</span>
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {survivors.length === 0 ? (
                            <div className="text-sm opacity-50 italic py-6 text-center border border-dashed border-zinc-600 rounded text-gray-400">
                              No active detections in current sector.
                            </div>
                          ) : (
                            survivors.map(s => (
                              <motion.div
                                key={s.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="p-3 border border-alert/30 bg-alert/10 rounded flex items-center justify-between overflow-hidden relative"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-alert/50" />
                                <div className="flex flex-col ml-2">
                                  <span className="text-sm font-bold text-alert">{s.type}</span>
                                  <span className="text-xs text-gray-300 mt-1">{s.id} | Conf: <strong className="text-white">{(s.confidence * 100).toFixed(0)}%</strong></span>
                                </div>
                                <Target className="w-5 h-5 text-alert" />
                              </motion.div>
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Resource Management */}
                    <div className="space-y-3">
                      <div className="text-sm uppercase opacity-70 font-bold mb-2 text-gray-300">Payload Inventory</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-zinc-700 rounded bg-zinc-900 shadow shadow-black/50">
                          <div className="text-sm text-gray-400 mb-1">Medical Kits</div>
                          <div className="text-2xl font-display font-bold text-white">
                            {drones.reduce((acc, d) => acc + d.payload.medicalKits, 0)}
                          </div>
                        </div>
                        <div className="p-4 border border-zinc-700 rounded bg-zinc-900 shadow shadow-black/50">
                          <div className="text-sm text-gray-400 mb-1">Water (L)</div>
                          <div className="text-2xl font-display font-bold text-white">
                            {drones.reduce((acc, d) => acc + d.payload.water, 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {rightTab === 'logs' && (
                  <motion.div key="logs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col h-full bg-black/50 border border-zinc-800 rounded min-h-[400px]">
                    <div className="px-4 py-3 border-b border-terminal-text/20 flex flex-col justify-between bg-zinc-900 rounded-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-terminal-text drop-shadow-[0_0_5px_rgba(0,255,65,0.4)]">
                          <Terminal className="w-4 h-4" /> Tactical Log
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-safe rounded-full animate-[pulse_1s_infinite]" />
                          <span className="text-sm uppercase font-bold text-gray-400 tracking-wider">Sync Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-y-auto p-4 font-mono space-y-3 flex-1">
                      {logs.length === 0 && <div className="text-gray-500 italic text-sm text-center mt-10">Awaiting tactical data...</div>}
                      {logs.map(log => (
                        <div key={log.id} className="flex gap-4 group items-start">
                          <span className="text-gray-500 shrink-0 text-xs mt-0.5">[{log.timestamp}]</span>
                          <div className="flex-1">
                            <span className={cn(
                              "font-bold mr-2 text-xs",
                              log.type === 'CRITICAL' ? "text-red-500 bg-red-500/10 px-1 py-0.5 rounded" :
                                log.type === 'WARNING' ? "text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded" :
                                  log.type === 'TOOL_CALL' ? "text-blue-400" :
                                    "text-terminal-text"
                            )}>
                              {log.type}
                            </span>
                            <span className="text-gray-200 text-xs leading-relaxed">{log.message}</span>
                            {log.summary && (
                              <div className="mt-2 p-3 bg-terminal-text/5 border-l-2 border-terminal-text/40 text-gray-300 text-xs italic shadow-inner">
                                {log.summary}
                              </div>
                            )}
                            {log.toolCall && (
                              <div className="mt-2 text-xs text-blue-300 font-mono bg-blue-900/20 p-2 rounded border border-blue-500/30">
                                <span className="text-blue-400 font-bold">{log.toolCall.name}</span>({JSON.stringify(log.toolCall.args)})
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-terminal-text/20 bg-black flex items-center justify-between px-4 text-sm font-semibold uppercase tracking-widest opacity-60">
        <div className="flex items-center gap-4">
          <span>KaijuGuard Command Agent</span>
          <span className="flex items-center gap-1"><Activity className="w-2 h-2 bg-safe rounded-full animate-pulse" /> Connection: Secure</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Latency: 42ms</span>
          <span>Buffer: 0%</span>
          <span>{new Date().toISOString()}</span>
        </div>
      </footer>
    </div>
  );
}
