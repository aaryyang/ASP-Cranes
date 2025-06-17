"""
Robust API server for ADK agent integration with CRM
Contains improved event handling, debug logging, and response extraction
"""

import os
import asyncio
import logging
import uuid
import nest_asyncio
import json

from flask import Flask, request, make_response, jsonify
from flask_cors import CORS

# Import the agent and necessary ADK components
from customer_service.agent import root_agent
from customer_service.integrations.crm_sync import crm_sync
from customer_service.config import Config

from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

# Allow asyncio in nested environments (important for Flask + async)
nest_asyncio.apply()

# Initialize app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend/CRM

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
config = Config()

# Session and runner setup
session_svc = InMemorySessionService()
runner = Runner(
    agent=root_agent,
    session_service=session_svc,
    app_name=config.app_name
)

@app.route('/agent/chat', methods=['POST'])
def chat_with_agent():
    """
    Endpoint for agent chat interactions
    Takes user message and returns agent response
    """
    try:
        # Extract request data
        data = request.json
        if not data:
            return jsonify({"error": "No request data provided"}), 400
            
        user_id = data.get('user_id', 'guest')
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400

        # If no session_id provided, generate one (1st message)
        session_id = data.get('session_id')
        if not session_id:
            session_id = f"{user_id}-{uuid.uuid4()}"
            logger.info(f"New session created: {session_id}")

        logger.info(f"Processing message from {user_id} (session {session_id}): {message}")

        # Wrap user message into ADK content format
        content = types.Content(role="user", parts=[types.Part(text=message)])

        # Run the agent interaction using get_event_loop
        loop = asyncio.get_event_loop()
        response_text = loop.run_until_complete(run_agent(user_id, session_id, content))

        # Create response with debug information in development
        response_data = {
            'response': response_text,
            'session_id': session_id,
            'status': 'success'
        }
        
        if os.environ.get('FLASK_ENV') == 'development':
            response_data['debug_info'] = {
                'response_length': len(response_text),
                'session_active': True
            }

        # Build safe JSON response
        return make_response(json.dumps(response_data), 200, {'Content-Type': 'application/json'})

    except Exception as e:
        logger.exception("Error during chat")
        return make_response(json.dumps({
            'error': str(e),
            'status': 'error'
        }), 500, {'Content-Type': 'application/json'})

async def run_agent(user_id: str, session_id: str, content: types.Content) -> str:
    """
    Run the agent and handle events to extract response text
    
    Args:
        user_id: The user ID for the session
        session_id: The session ID for this interaction
        content: The content to send to the agent
        
    Returns:
        The complete response text from the agent
    """
    response_parts = []

    # Create session explicitly (avoids 'Session not found')
    await session_svc.create_session(
        user_id=user_id,
        session_id=session_id,
        app_name=config.app_name
    )

    logger.info(f"Starting agent run for session {session_id}")
    
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content
        ):
            # Log event details to understand structure
            event_type = type(event).__name__
            event_author = getattr(event, 'author', 'unknown')
            logger.info(f"Event: type={event_type}, author={event_author}")
            
            # Extract text from various event structures
            extracted_text = extract_text_from_event(event)
            if extracted_text:
                logger.info(f"Extracted text ({len(extracted_text)} chars): {extracted_text[:50]}...")
                response_parts.append(extracted_text)
            else:
                logger.debug(f"No text extracted from event: {event}")
        
        final_response = "".join(response_parts)
        
        if not final_response:
            logger.warning("No response was collected from agent events")
            return "I apologize, but I'm having trouble processing your request right now."
        
        logger.info(f"Final response built (length={len(final_response)})")
        return final_response
        
    except Exception as e:
        logger.exception(f"Error during agent run: {e}")
        return "I apologize, but an error occurred while processing your request."

def extract_text_from_event(event):
    """
    Extract text content from various event structures
    
    Args:
        event: ADK event object from runner
        
    Returns:
        Extracted text or empty string if no text found
    """
    # Case 1: event has content with parts (typical ADK Gemini response)
    if hasattr(event, 'content') and event.content:
        if hasattr(event.content, 'parts'):
            parts_text = []
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    parts_text.append(part.text)
            if parts_text:
                return "".join(parts_text)
        
        # Case 2: event content has direct text attribute
        elif hasattr(event.content, 'text') and event.content.text:
            return event.content.text
        
    # Case 3: event has direct text attribute
    elif hasattr(event, 'text') and event.text:
        return event.text
    
    # Case 4: event has response attribute with text
    elif hasattr(event, 'response') and event.response:
        if hasattr(event.response, 'text'):
            return event.response.text
        elif isinstance(event.response, str):
            return event.response
    
    # No text found
    return ""

@app.route('/agent/leads', methods=['GET'])
def get_captured_leads():
    """Endpoint to retrieve captured leads"""
    return make_response(json.dumps({
        'leads': 'This would list captured leads.',
        'status': 'info'
    }), 200, {'Content-Type': 'application/json'})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return make_response(json.dumps({'status': 'healthy'}), 200, {'Content-Type': 'application/json'})

@app.route('/test-echo', methods=['POST'])
def test_echo():
    """Echo endpoint for testing API connection"""
    try:
        data = request.json
        return make_response(json.dumps({
            'echo': data,
            'received': True
        }), 200, {'Content-Type': 'application/json'})
    except Exception as e:
        return make_response(json.dumps({
            'error': str(e),
            'status': 'error'
        }), 500, {'Content-Type': 'application/json'})

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting API server on port {port}, debug={debug}")
    logger.info(f"Agent model: {root_agent.model}")
    logger.info(f"App name: {config.app_name}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
