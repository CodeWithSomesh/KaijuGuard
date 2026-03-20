import os
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_mcp_agent():
    # Reset session commands
    cmd_file = os.path.join(os.path.dirname(__file__), 'commands_output.json')
    if os.path.exists(cmd_file):
        os.remove(cmd_file)

    server_script = os.path.join(os.path.dirname(__file__), 'server.py')
    server_params = StdioServerParameters(command="python", args=[server_script])
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # MCP Real-time Tool Discovery
            tools_response = await session.list_tools()
            langchain_tools = []
            for t in tools_response.tools:
                langchain_tools.append({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.inputSchema
                    }
                })

            llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
            llm_with_tools = llm.bind_tools(langchain_tools)
            
            messages = [
                SystemMessage(content="""
You are the KaijuGuard Swarm Intelligence Commander. Your goal is to orchestrate a fleet of autonomous disaster response drones.
1. Use get_active_drones() to discover which drones are active in the specific region.
2. Cycle through the drones and check get_drone_details() for battery levels and payload status.
3. Identify any drone under 20% battery and STRICTLY order them to return_to_base().
4. Dispatch remaining drones to tactical coordinates via move_to(drone_id, x, y).
5. VERY IMPORTANT: You must sequence localized tools to the SAME location. Chain move_to with thermal_scan(drone_id).
6. CRITICAL: If any drone reports status 'STUCK', you MUST dispatch an IDLE drone to its exact location using move_to() immediately to resume its mission.
7. Apply ADVANCED SWARM PROTOCOLS:
   - drop_medical_supplies(drone_id): use on drones doing thermal_scan to preemptively assist discovered survivors.
   - deploy_mesh_network(drone_id): use on at least one drone to boost region comms.
   - analyze_structural_integrity(drone_id, x, y): assign to a drone scanning high-risk infrastructure.
Work completely autonomously until all active drones have been given mission parameters, then end execution.
"""),
                HumanMessage(content="Initiate swarm-intelligence response. Identify local active units, dispatch them, and coordinate thermal scanning alongside medical payload drops. Ensure mesh networks are established.")
            ]
            
            for iter_count in range(12):  # Bound loop to prevent infinite runs
                print(f"Agent reasoning step {iter_count}...")
                response = await llm_with_tools.ainvoke(messages)
                messages.append(response)
                
                if response.tool_calls:
                    for tool_call in response.tool_calls:
                        print(f"Executing MCP Tool: {tool_call['name']}")
                        tool_res = await session.call_tool(tool_call["name"], arguments=tool_call["args"])
                        res_text = tool_res.content[0].text if tool_res.content else "Executed."
                        messages.append(ToolMessage(content=res_text, tool_call_id=tool_call["id"]))
                else:
                    print("Agent finished execution.")
                    break

            summary = messages[-1].content

    # Retrieve parsed tools
    cmds = []
    if os.path.exists(cmd_file):
        with open(cmd_file, 'r') as f:
            try:
                cmds = json.load(f)
            except:
                pass

    return {"summary": summary, "toolCalls": cmds}

@app.post("/api/analyze")
async def analyze(request: Request):
    data = await request.json()
    
    state_file = os.path.join(os.path.dirname(__file__), 'shared_state.json')
    with open(state_file, 'w') as f:
        json.dump(data, f)
        
    print("Triggered tactical analysis with MCP agent.")
    try:
        result = await run_mcp_agent()
        return result
    except Exception as e:
        print(f"Error in agent execution: {e}")
        return {"summary": "Agent error: " + str(e), "toolCalls": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
