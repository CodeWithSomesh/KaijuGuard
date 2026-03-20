export enum DroneStatus {
  IDLE = "IDLE",
  SCANNING = "SCANNING",
  DISPATCHED = "DISPATCHED",
  RETURNING = "RETURNING",
  CHARGING = "CHARGING",
  EMERGENCY = "EMERGENCY",
  BROADCASTING = "BROADCASTING",
}

export interface Drone {
  id: string;
  name: string;
  battery: number;
  signal: number;
  payload: {
    medicalKits: number;
    water: number;
  };
  status: DroneStatus;
  position: { x: number; y: number };
  target?: { x: number; y: number };
  history: { x: number; y: number }[];
}

export interface Survivor {
  id: string;
  lat: number;
  lng: number;
  confidence: number;
  type: "HEAT_SIGNATURE" | "SOS_SIGNAL";
  timestamp: string;
}

export interface TacticalLog {
  id: string;
  timestamp: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "TOOL_CALL";
  message: string;
  summary?: string;
  toolCall?: {
    name: string;
    args: any;
  };
}

export interface ZoneMap {
  id: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  data: any; // LIDAR/Photogrammetry data
}

export interface ChargingStation {
  id: string;
  name: string;
  position: { x: number; y: number };
  capacity: number;
  activeUnits: number;
}

export interface Obstacle {
  id: string;
  position: { x: number; y: number };
  radius: number;
  type: "NO_FLY_ZONE" | "HIGH_TERRAIN" | "WEATHER_HAZARD";
}
