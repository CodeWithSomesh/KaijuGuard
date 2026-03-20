<div align="center">
  <img src="client/public/logo.png" alt="KaijuGuard Logo" width="200"/>
  <h1>🛡️ KaijuGuard Command Center</h1>
  <p><strong>Next-Generation Autonomous Swarm Intelligence for Disaster Response</strong></p>
</div>

---

## ⚡ Overview

**KaijuGuard** is an advanced, AI-driven disaster response simulation built to orchestrate fleets of autonomous tactical drones. Inspired by the sleek, high-tech aesthetics of modern sci-fi defense forces (like *Kaiju No 8*), this platform fuses real-time geospacial mapping with cutting-edge Local Language Model (LLM) agent frameworks. 

When disaster strikes, the **AI Commander Agent** autonomously evaluates the crisis, dynamically dispatches local swarm units, routes them across terrain, and executes critical operations (like thermal scanning and medical payload drops) entirely on its own using the **Model Context Protocol (MCP)**.

---

## ✨ Key Features

- 🗺️ **Dynamic 2D/3D Tactical Mapping**: Seamlessly switch between global tactical satellite displays, 3D Mapbox cityscapes, and sleek radar views.
- 🧠 **Autonomous AI Commander**: Powered by `langchain-google-genai`, the Commander Agent analyzes emergency JSON feeds and orchestrates the drone fleet without human intervention.
- 📡 **FastMCP Integration**: A lightning-fast Python MCP server exposes live tools to the AI, including `move_to`, `thermal_scan`, `drop_medical_supplies`, and `deploy_mesh_network`.
- 🚁 **Live Swarm Simulation**: Watch as hundreds of drones deploy from global charging hubs, traverse the map via calculated paths (represented by glowing dashed lines), and execute complex rescue operations.
- ⚠️ **Intelligent Fault Tolerance**: Built-in `STUCK` simulation dynamically disrupts a drone's flight. The AI Commander instantly detects the failure and scrambles a reinforcement unit to take over the mission.
- 💻 **Futuristic UI/UX**: Dark-mode dominant with terminal-green `#00ff88` accents, glowing neon drone tracking, immersive background overlays, and a live tactical data feed.

---

## 🏗️ Architecture

The project is split into a robust dual-stack architecture:

### 1. The Client (React / Next.js)
A high-performance frontend simulation engine built with **Next.js** and **React**.
- Maintains the deterministic `DisasterModel` simulation loop state.
- Renders stunning map overlays using `pigeon-maps` and `mapbox-gl`.
- Streams live state snapshots to the Python backend via a Next.js proxy API `/api/agent`.

### 2. The Agent Backend (Python / FastAPI / LangChain)
The brains of the operation.
- **`server.py`**: A `FastMCP` server exposing stateless tactical functions (e.g., retrieving battery levels, scanning coordinates).
- **`agent.py`**: The LangChain execution loop. It ingests the JSON state, plans the most efficient deployment of idle units to SOS spots, and executes the exact MCP toolchain needed to save lives.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Google Gemini API Key
- A Mapbox Access Token

### 1. Client Setup
Navigate to the client directory, install dependencies, and run the development server:
```bash
cd client
npm install
npm run dev
```
Make sure to create a `.env` file in the `client` directory:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### 2. Agent Setup
Navigate to the agents directory, install the Python requirements, and boot up the Commander Agent endpoints:
```bash
cd agents
pip install -r requirements.txt
uvicorn commander_agent.agent:app --host 0.0.0.0 --port 8000
```
Make sure to create a `.env` file in the `agents/commander_agent` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

---

## 🎮 Usage Guide

1. Open your browser to `http://localhost:3000`.
2. Ensure both the Next.js server and the Python `uvicorn` server are running.
3. Observe the global fleet of idle drones resting at their respective city Charging Hubs.
4. Click **Simulate Disaster** in the left-hand command panel.
5. Watch the Tactical Log as the AI Commander autonomously discovers the crisis, calculates targets, and assigns the local swarm.
6. Observe the drones animate across the map to conduct their rescue operations!

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Next.js 15, Tailwind CSS, Framer Motion, Recharts
- **Mapping**: Mapbox GL JS, Pigeon Maps
- **Backend**: Python, FastAPI, Uvicorn 
- **AI & Tools**: LangChain, FastMCP (Model Context Protocol), Google Gemini

<div align="center">
  <p><i>"Defending tomorrow, today."</i></p>
</div>
