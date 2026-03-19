import { Drone, Survivor, TacticalLog } from "../types";

export async function getTacticalAnalysis(
  fleet: Drone[],
  survivors: Survivor[],
  logs: TacticalLog[]
) {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fleet, survivors, logs }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("ADK Service Error:", error);
    return {
      summary: "Communication link unstable. Failed to reach Google ADK endpoint.",
      toolCalls: []
    };
  }
}
