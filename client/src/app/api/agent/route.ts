import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Call the Python Command Agent running locally
    const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000/api/analyze';
    
    const response = await fetch(aiBackendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
       throw new Error(`Python API returned ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Command Agent Execution Error:", error);
    return NextResponse.json({ 
      summary: "Communication link to Python Command Agent offline.", 
      toolCalls: [] 
    }, { status: 500 });
  }
}
