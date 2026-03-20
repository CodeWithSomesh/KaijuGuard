import { GoogleGenAI } from "@google/genai";
import { Drone, Survivor, TacticalLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getTacticalAnalysis(
  fleet: Drone[],
  survivors: Survivor[],
  logs: TacticalLog[]
) {
  const context = {
    fleet,
    survivors,
    recentLogs: logs.slice(-5),
    operationalProtocol: "KaijuGuard Autonomous Command Agent (Edge-First)",
    prioritizationMatrix: {
      P1: "Direct survivor detection",
      P2: "Mapping black zones",
      P3: "Battery/Home-base rotation"
    }
  };

  const prompt = `
    You are the "KaijuGuard" Autonomous Command Agent. 
    Analyze the current fleet status and survivor data.
    Provide a "Tactical Summary" and decide if any tools need to be called.
    
    Tools available:
    - map_zone(coordinates: {lat, lng}, radius: number)
    - detect_survivors(drone_id: string, video_stream_metadata: any)
    - broadcast_audio(drone_id: string, message_id: string): Broadcasts reassurance to survivors.
    - manage_resources(drone_fleet_status: any): Re-routes drones < 25% battery to nearest charging station (Priority 3).
    - dispatch_drone(target_lat_long: {lat, lng}, priority_level: number)

    Rules:
    - If a survivor is detected, immediately call broadcast_audio.
    - If a drone battery < 25%, call manage_resources to re-route to charging.
    - If a drone battery < 15%, dispatch a replacement.
    - Prioritize survivor detection.
    - Output in JSON format.

    Current Context:
    ${JSON.stringify(context, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Communication link unstable. Reverting to local cached logic.",
      toolCalls: []
    };
  }
}
