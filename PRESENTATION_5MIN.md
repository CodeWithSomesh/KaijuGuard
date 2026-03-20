# KaijuGuard — 5-Minute Preliminary Presentation Script

---

## 1. CHOSEN CASE STUDY & REASON(S)
**~45 seconds**

**Case Study:** First Responder of the Future — Decentralised Swarm Intelligence (SDG 9 & 3)

**Why this case study:**
- ASEAN sits on the Pacific Ring of Fire. Super typhoons and earthquakes hit our region regularly.
- In the critical first 72 hours, cell towers and internet often fail — a communication blackout.
- Cloud-based AI becomes useless when the world goes offline.

**Emotional driver (deliver with conviction):**
> *"I chose this case study because I've seen the news — families trapped under rubble, rescue teams unable to coordinate, and survivors waiting for help that arrives too late. In those first 72 hours, every minute matters. I wanted to build something that doesn't give up when the infrastructure does. KaijuGuard is my answer: a swarm that thinks at the edge, discovers its own fleet, and delivers aid — even when the world is offline."*

---

## 2. PROPOSED SOLUTION
**~50 seconds**

**KaijuGuard** is an autonomous command agent that orchestrates a fleet of rescue drones through the **Model Context Protocol (MCP)**.

**How it solves the problem:**

| Challenge | Our Solution |
|-----------|--------------|
| Cloud dependency | Command agent runs locally; MCP server exposes drone tools at the edge |
| Hard-coded drone control | **Real-time tool discovery** via `list_tools()` — agent discovers which drones are active, no hard-coded IDs |
| Centralised failure | MCP standardises communication; simulation includes mesh network deployment for resilient comms |
| Mission planning | Agent decomposes high-level goals into sequenced tool calls: `move_to` → `thermal_scan` → `drop_medical_supplies` |
| Battery failure | Agent checks `get_drone_details()` for battery, recalls drones <20% via `return_to_base()` before failure |

**One-liner:** *"KaijuGuard turns 'scan the South-East quadrant for thermal signatures' into specific, sequenced MCP tool calls — autonomously, adaptively, and without hard-coding a single drone."*

---

## 3. FRONT-END DEMO
**~50 seconds**

**Show (in order):**

1. **Reset + Region selection** — "Malaysia, Japan — ASEAN and Pacific regions at risk."
2. **Simulate Disaster** — "Earthquake in Sabah. 18 SOS spots. Local KaijuGuard units activate."
3. **Tactical Analysis** — "One click. The MCP Command Agent discovers the fleet, checks battery, assigns drones to SOS spots, sequences move → scan → drop supplies."
4. **Live map** — "Drones dispatch to coordinates. Thermal scan and medical drops queue. Low-battery drones auto-return to charging."
5. **Terminal + logs** — "Tool calls visible: `move_to`, `thermal_scan`, `drop_payload`, `return_to_base` — all via MCP."

**Demo punchline:** *"All of this — fleet discovery, assignment, sequencing — is driven by the agent through MCP tools. No hard-coded movements."*

---

## 4. SUITABLE TECHNOLOGIES
**~25 seconds**

| Layer | Tech |
|-------|------|
| Command Agent | Python, LangChain, Gemini (LLM) |
| MCP Server | FastMCP — exposes drone tools (`move_to`, `thermal_scan`, `return_to_base`, etc.) |
| MCP Client | `mcp` Python package — stdio client, `list_tools()`, `call_tool()` |
| Simulation | TypeScript, React — 2D/3D map, disaster model, battery decay |
| Front-end | Next.js, Pigeon Maps / Mapbox, Recharts |

**Key point:** MCP is the mandatory protocol — every agent–drone interaction goes through it.

---

## 5. BUSINESS MODEL
**~20 seconds**

- **B2G (Primary):** Licensing to national disaster management agencies (e.g., NADMA Malaysia, NDRRMC Philippines).
- **B2B:** White-label swarm orchestration for private emergency response firms and NGOs.
- **Recurring:** Software-as-a-Service (SaaS) for simulation, training, and mission rehearsal; hardware-agnostic, drone-agnostic.

---

## 6. MARKET SEGMENT
**~20 seconds**

- **Primary:** ASEAN + Pacific disaster-prone countries (Philippines, Indonesia, Malaysia, Japan).
- **Secondary:** NGOs (Red Cross, Médecins Sans Frontières), UN OCHA regional hubs.
- **TAM:** Global disaster response tech market — growing with climate intensity.

---

## 7. COMPETITOR ANALYSIS
**~25 seconds**

| Competitor | Limitation | KaijuGuard Differentiator |
|------------|------------|---------------------------|
| Centralised rescue platforms | Cloud-dependent; fail in blackout | Edge-first MCP orchestration; simulation of offline operation |
| Fixed drone fleets | Hard-coded IDs; inflexible | Real-time fleet discovery; adapts to available drones |
| Manual coordination | Human bottleneck in first 72h | Autonomous mission decomposition; sequenced tool execution |

**Punchline:** *"We're not just another drone dashboard. We're building the brain that keeps working when the cloud goes dark."*

---

## 8. ROOM FOR FUTURE IMPROVEMENTS
**~45 seconds**

**Honest, forward-looking:**

1. **Full offline resilience** — Command agent currently uses a cloud LLM. Roadmap: local model (e.g., Gemma, Llama) or deterministic rule fallback for true blackout operation.
2. **Chain-of-thought visibility** — Judges want explicit "reason before execute." We'll surface agent rationale before tool calls for transparency and auditability.
3. **Active fleet filtering** — Discovery today returns all drones. We'll filter by status (IDLE vs active) and region for smarter assignment.
4. **True decentralisation** — Move from central-only planning to peer-to-peer swarm logic; drones share findings and cooperatively cover sectors.
5. **On-device thermal AI** — Replace simulated detection with real on-device thermal inference for survivor recognition.

**Closing line:** *"We've built the foundation — MCP integration, autonomous planning, battery-aware orchestration. The next 20 days are about hardening it for the real world."*

---

## TIMING CHEAT SHEET (5 min)

| Section | Time |
|---------|------|
| Case study + emotional reason | 0:45 |
| Proposed solution | 0:50 |
| Front-end demo | 0:50 |
| Technologies | 0:25 |
| Business model | 0:20 |
| Market segment | 0:20 |
| Competitor analysis | 0:25 |
| Room for improvement | 0:45 |
| **Buffer** | 0:10 |

---

*"KaijuGuard — When the world goes dark, the swarm still thinks."*
