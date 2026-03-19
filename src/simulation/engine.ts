import { Drone, DroneStatus, Survivor, ChargingStation, Obstacle } from "../types";

export abstract class Agent {
  constructor(public id: string, public pos: { x: number; y: number }) {}
  abstract step(model: DisasterModel): void;
}

export class DroneAgent extends Agent {
  public battery: number = 100;
  public status: DroneStatus = DroneStatus.IDLE;
  public target: { x: number; y: number } | null = null;
  public path: { x: number; y: number }[] = [];
  public history: { x: number; y: number }[] = [];

  constructor(id: string, pos: { x: number; y: number }, public name: string) {
    super(id, pos);
    this.history = [{ ...pos }];
  }

  setTarget(target: { x: number; y: number }, model: DisasterModel) {
    this.target = target;
    this.path = this.computePath(this.pos, target, model.obstacles);
  }

  private computePath(start: { x: number; y: number }, end: { x: number; y: number }, obstacles: Obstacle[]): { x: number; y: number }[] {
    // Check if straight line is clear
    const isPathClear = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      for (const obs of obstacles) {
        // Simple distance from segment to circle center
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((obs.position.x - p1.x) * dx + (obs.position.y - p1.y) * dy) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        const distSq = (obs.position.x - projX) ** 2 + (obs.position.y - projY) ** 2;
        if (distSq < (obs.radius * 1.2) ** 2) return false; // 20% safety margin
      }
      return true;
    };

    if (isPathClear(start, end)) return [end];

    // Simple A* implementation on a local grid
    const gridRes = 0.05; // ~5km resolution
    const openSet: any[] = [{ x: start.x, y: start.y, g: 0, h: this.dist(start, end), f: this.dist(start, end), parent: null }];
    const closedSet = new Set<string>();
    const maxIterations = 200;
    let iterations = 0;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const key = `${current.x.toFixed(2)},${current.y.toFixed(2)}`;
      
      if (this.dist(current, end) < gridRes * 1.5) {
        // Reconstruct path
        const path = [];
        let curr = current;
        while (curr.parent) {
          path.unshift({ x: curr.x, y: curr.y });
          curr = curr.parent;
        }
        path.push(end);
        return path;
      }

      closedSet.add(key);

      // 8-way movement
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nextX = current.x + dx * gridRes;
          const nextY = current.y + dy * gridRes;
          const nextPos = { x: nextX, y: nextY };
          const nextKey = `${nextX.toFixed(2)},${nextY.toFixed(2)}`;

          if (closedSet.has(nextKey)) continue;

          // Check if point is inside any obstacle
          const inObstacle = obstacles.some(obs => this.dist(nextPos, obs.position) < obs.radius * 1.1);
          if (inObstacle) continue;

          const g = current.g + (dx !== 0 && dy !== 0 ? 1.414 : 1) * gridRes;
          const h = this.dist(nextPos, end);
          const f = g + h;

          const existing = openSet.find(n => n.x.toFixed(2) === nextX.toFixed(2) && n.y.toFixed(2) === nextY.toFixed(2));
          if (existing && existing.g <= g) continue;

          if (!existing) {
            openSet.push({ x: nextX, y: nextY, g, h, f, parent: current });
          } else {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        }
      }
    }

    return [end]; // Fallback to straight line if A* fails or times out
  }

  private dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  step(model: DisasterModel): void {
    // Record history every few steps or on significant movement
    if (model.stepCount % 5 === 0) {
      this.history.push({ ...this.pos });
      if (this.history.length > 50) this.history.shift();
    }

    // Battery logic
    if (this.status !== DroneStatus.CHARGING && this.status !== DroneStatus.IDLE) {
      this.battery = Math.max(0, this.battery - 0.2);
      
      // Auto-return to base if battery is low
      if (this.battery < 20 && this.status !== DroneStatus.RETURNING && model.stations.length > 0) {
        const nearest = model.stations.reduce((prev, curr) => 
          this.dist(this.pos, curr.position) < this.dist(this.pos, prev.position) ? curr : prev
        );
        this.status = DroneStatus.RETURNING;
        this.setTarget(nearest.position, model);
      }
    } else if (this.status === DroneStatus.CHARGING) {
      this.battery = Math.min(100, this.battery + 1.0);
      if (this.battery >= 100) this.status = DroneStatus.IDLE;
    }

    // Movement logic (Lat/Lng movement)
    if (this.path.length > 0) {
      const nextWaypoint = this.path[0];
      const dx = nextWaypoint.x - this.pos.x;
      const dy = nextWaypoint.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 0.02; // Approx 2km per step
      if (dist > speed) {
        this.pos.x += (dx / dist) * speed;
        this.pos.y += (dy / dist) * speed;
      } else {
        this.pos.x = nextWaypoint.x;
        this.pos.y = nextWaypoint.y;
        this.path.shift();
        if (this.path.length === 0) {
          this.handleArrival(model);
        }
      }
    } else if (this.status === DroneStatus.SCANNING) {
      // Random walk for scanning (small steps in lat/lng)
      this.pos.x += (Math.random() - 0.5) * 0.02;
      this.pos.y += (Math.random() - 0.5) * 0.02;
    }
  }

  private handleArrival(model: DisasterModel) {
    if (this.status === DroneStatus.RETURNING) {
      this.status = DroneStatus.CHARGING;
      this.target = null;
    } else if (this.status === DroneStatus.DISPATCHED) {
      this.status = DroneStatus.SCANNING;
      this.target = null;
    }
  }
}

export class SurvivorAgent extends Agent {
  public confidence: number;
  public type: "HEAT_SIGNATURE" | "SOS_SIGNAL";

  constructor(id: string, pos: { x: number; y: number }) {
    super(id, pos);
    this.confidence = 0.8 + Math.random() * 0.2;
    this.type = Math.random() > 0.5 ? "HEAT_SIGNATURE" : "SOS_SIGNAL";
  }

  step(model: DisasterModel): void {
    // Survivors might move slightly or signal strength might fluctuate
    this.confidence = Math.max(0.5, Math.min(1, this.confidence + (Math.random() - 0.5) * 0.05));
  }
}

export class DisasterModel {
  public agents: Agent[] = [];
  public schedule: Agent[] = [];
  public stepCount: number = 0;
  public stations: ChargingStation[] = [];
  public obstacles: Obstacle[] = [];

  constructor(public width: number, public height: number) {}

  addAgent(agent: Agent) {
    this.agents.push(agent);
    this.schedule.push(agent);
  }

  step() {
    this.stepCount++;
    // Shuffle schedule for fair execution (Mesa style)
    const shuffled = [...this.schedule].sort(() => Math.random() - 0.5);
    shuffled.forEach(agent => agent.step(this));
  }

  getDrones(): Drone[] {
    return this.agents
      .filter(a => a instanceof DroneAgent)
      .map(a => {
        const d = a as DroneAgent;
        return {
          id: d.id,
          name: d.name,
          battery: d.battery,
          status: d.status,
          position: d.pos,
          target: d.target || undefined,
          history: d.history,
          signal: 100, // Simplified
          payload: { medicalKits: 2, water: 5 } // Simplified
        };
      });
  }

  getSurvivors(): Survivor[] {
    return this.agents
      .filter(a => a instanceof SurvivorAgent)
      .map(a => {
        const s = a as SurvivorAgent;
        return {
          id: s.id,
          lat: s.pos.x, // Mapping grid to "lat" for UI compatibility
          lng: s.pos.y,
          confidence: s.confidence,
          type: s.type,
          timestamp: new Date().toLocaleTimeString()
        };
      });
  }
}
