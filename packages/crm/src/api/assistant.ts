import { Request, Response } from 'express';
import axios from 'axios';

// Configuration for the ASP Cranes Agent API
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:5000/agent/chat';
const AGENT_API_KEY = process.env.AGENT_API_KEY; // Optional API key if needed in the future

export async function handleAssistantRequest(req: Request, res: Response) {
  try {
    const { message, user_id, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare request to the ASP Cranes Agent
    const requestPayload = {
      message,
      user_id: user_id || 'api_user', // Use provided user_id or default
      session_id // Include session_id if provided for conversation continuity
    };

    console.log('Forwarding request to ASP Cranes Agent:', requestPayload);

    // Forward the request to the ASP Cranes Agent
    const response = await axios.post(AGENT_API_URL, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        ...(AGENT_API_KEY && { 'Authorization': `Bearer ${AGENT_API_KEY}` }),
      },
    });

    console.log('Response received from agent:', response.data);

    // Return the agent's response directly
    return res.json(response.data);
  } catch (error) {
    console.error('Error in assistant API:', error);
    return res.status(500).json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}