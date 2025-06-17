# ASP Cranes AI Agent Integration with CRM

This project integrates the ASP Cranes AI Agent (built with Google ADK) with the ASP CRM system.

## Overview

The integration connects the AI agent's capabilities to the CRM system, enabling:
- Real-time chat with customers via the CRM interface
- Automatic lead capture and synchronization to the CRM database
- Equipment quotation generation and storage in the CRM

## Components

1. **ASP Cranes Agent** - An AI agent built with Google ADK that handles customer service tasks
2. **CRM System** - A React/TypeScript-based CRM for managing leads, quotes, and customer interactions

## Setup Instructions

### 1. Install Dependencies

For the AI Agent:
```bash
cd ASP-Cranes-Agent
pip install -r requirements_crm.txt
```

For the CRM Frontend:
```bash
cd ASP-Latest-CRM-master
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` in the CRM directory and update with your settings:
```bash
cp .env.example .env
```

Make sure to set the correct `VITE_AGENT_API_URL` pointing to your agent server.

### 3. Start the AI Agent Server

```bash
cd ASP-Cranes-Agent
python api_server.py
```

The agent server will run on port 5000 by default.

### 4. Start the CRM Frontend

```bash
cd ASP-Latest-CRM-master
npm run dev
```

The CRM will be available at http://localhost:5173

## Integration Points

1. **Chat Interface** - Located in the CRM under the "AI Assistance" page
2. **Lead Management** - AI agent captures lead information which gets synchronized to the CRM
3. **Quotation Generation** - AI agent can generate quotations that appear in the CRM's quotation management section

## API Endpoints

- `/agent/chat` - Chat with the AI agent (Agent API)
- `/api/leads` - Sync lead information to CRM
- `/api/quotations` - Sync quotation information to CRM

## Maintaining Sessions

The integration maintains user sessions to preserve conversation context. Each user in the CRM system gets a dedicated session with the AI agent.

## Debugging Tips

- Check the agent server logs for interaction details
- Firebase Firestore stores all chat messages and can be inspected for troubleshooting
- The CRM interface includes logging for agent responses

## Production Deployment

For production deployment:
1. Set up proper API authentication
2. Replace InMemorySessionService with a persistent storage solution
3. Configure proper CORS settings for security
4. Set up environment variables for production URLs
