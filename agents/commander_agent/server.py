import json
import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("KaijuGuard Command MCP")

def get_state():
    state_file = os.path.join(os.path.dirname(__file__), 'shared_state.json')
    if os.path.exists(state_file):
        with open(state_file, 'r') as f:
            return json.load(f)
    return {"fleet": [], "survivors": [], "logs": []}

def add_command(cmd):
    cmd_file = os.path.join(os.path.dirname(__file__), 'commands_output.json')
    cmds = []
    if os.path.exists(cmd_file):
        with open(cmd_file, 'r') as f:
            try:
                cmds = json.load(f)
            except:
                pass
    cmds.append(cmd)
    with open(cmd_file, 'w') as f:
        json.dump(cmds, f)

@mcp.tool()
def get_active_drones() -> list[str]:
    """Returns a list of active drone IDs to discover fleet members."""
    state = get_state()
    return [drone.get('id') for drone in state.get('fleet', [])]

@mcp.tool()
def get_drone_details(drone_id: str) -> str:
    """Returns the battery, position, and status of a specific drone."""
    state = get_state()
    for drone in state.get('fleet', []):
        if drone.get('id') == drone_id:
            return json.dumps({
                "id": drone.get("id"),
                "battery": drone.get("battery"),
                "status": drone.get("status"),
                "position": drone.get("position")
            })
    return json.dumps({"error": "Drone not found"})

@mcp.tool()
def move_to(drone_id: str, x: float, y: float) -> str:
    """Dispatches a drone to a specific tactical waypoint (x, y coordinate)."""
    add_command({"name": "move_to", "args": {"drone_id": drone_id, "x": x, "y": y}})
    return f"move_to command queued for {drone_id} to coordinate ({x}, {y})"

@mcp.tool()
def return_to_base(drone_id: str) -> str:
    """Recalls a drone to the nearest charging station immediately due to low battery."""
    add_command({"name": "return_to_base", "args": {"drone_id": drone_id}})
    return f"return_to_base command queued for {drone_id}"

@mcp.tool()
def thermal_scan(drone_id: str) -> str:
    """Simulates the drone initiating a thermal scan for survivors at its target location."""
    add_command({"name": "detect_survivors", "args": {"drone_id": drone_id}})
    return f"thermal_scan initiated for {drone_id}"

@mcp.tool()
def drop_medical_supplies(drone_id: str) -> str:
    """Drops medical supplies from the drone's payload to assist local survivors."""
    add_command({"name": "drop_payload", "args": {"drone_id": drone_id, "type": "medical_kit"}})
    return f"drop_payload command queued for {drone_id}"

@mcp.tool()
def deploy_mesh_network(drone_id: str) -> str:
    """Deploys a sub-node to establish an emergency communications mesh network."""
    add_command({"name": "deploy_mesh", "args": {"drone_id": drone_id}})
    return f"deploy_mesh command queued for {drone_id}"

@mcp.tool()
def analyze_structural_integrity(drone_id: str, x: float, y: float) -> str:
    """Performs a deep lidar scan of a structure to assess collapse probability."""
    add_command({"name": "structural_scan", "args": {"drone_id": drone_id, "x": x, "y": y}})
    return f"structural_scan command queued for {drone_id}"

if __name__ == "__main__":
    mcp.run()
