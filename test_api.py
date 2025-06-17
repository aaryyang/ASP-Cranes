"""
API Tester Script

This script tests the API server without requiring Postman.
It sends requests to the local API server and prints the responses.
"""

import requests
import json
import uuid
import sys

# Default configuration
DEFAULT_API_URL = "http://localhost:5000/agent/chat"
DEFAULT_MESSAGE = "Tell me about your crane rental services"

def send_request(api_url, message, session_id=None):
    """
    Send a chat request to the API server
    
    Args:
        api_url: The API endpoint URL
        message: The message to send
        session_id: Optional session ID for continuing conversations
        
    Returns:
        The API response as a dictionary
    """
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "message": message,
        "user_id": "test_user"
    }
    
    if session_id:
        payload["session_id"] = session_id
    
    print(f"\nSending request to {api_url}:")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        print(f"\nStatus code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            print(f"Error: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None
    except json.JSONDecodeError:
        print(f"JSON decode error. Raw response: {response.text}")
        return None

def main():
    """Main function to run the script"""
    # Get message from command line arguments or use default
    message = DEFAULT_MESSAGE
    api_url = DEFAULT_API_URL
    
    if len(sys.argv) > 1:
        message = sys.argv[1]
    
    # Send the request
    result = send_request(api_url, message)
    
    if result:
        print("\nResponse received:")
        print("-" * 80)
        if "response" in result and result["response"]:
            print(f"Agent response: {result['response']}")
        else:
            print("No response received from agent.")
        
        print("-" * 80)
        print(f"Session ID: {result.get('session_id', 'None')}")
        print(f"Status: {result.get('status', 'Unknown')}")
        
        # Continue conversation if requested
        session_id = result.get('session_id')
        if session_id:
            while True:
                follow_up = input("\nEnter follow-up message (or 'quit' to exit): ")
                if follow_up.lower() in ('quit', 'exit', 'q'):
                    break
                    
                # Send follow-up with session ID
                follow_result = send_request(api_url, follow_up, session_id)
                if follow_result and "response" in follow_result:
                    print("\nResponse received:")
                    print("-" * 80)
                    print(f"Agent response: {follow_result['response']}")
                    print("-" * 80)

if __name__ == "__main__":
    main()
