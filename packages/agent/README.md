# ASP Cranes Agent & CRM Integration

This project consists of two main components:
1. **ASP Cranes Agent** - A Python-based AI agent built with Google ADK that provides customer service and lead generation capabilities
2. **ASP CRM** - A TypeScript/React CRM system that provides a web interface for managing customer relationships

## Project Structure

The project is organized into two main directories:

### ASP-Cranes-Agent
Contains the Python AI agent built with Google ADK:

```
ASP-Cranes-Agent/
├── robust_api_server.py        # Main API server for external integration
├── requirements_crm.txt        # Python dependencies
├── service-account.json        # GCP credentials (keep private)
├── INTEGRATION_GUIDE.md        # Integration instructions
│
└── customer_service/           # Core agent functionality
    ├── agent.py                # Agent definition
    ├── config.py               # Configuration settings
    ├── prompts.py              # Agent prompts
    ├── entities/               # Data models
    ├── integrations/           # External service integrations
    ├── shared_libraries/       # Utility functions
    └── tools/                  # Agent tools implementation
```

### ASP-Latest-CRM-master
Contains the TypeScript/React CRM frontend:

```
ASP-Latest-CRM-master/
├── src/
│   ├── api/                    # API handlers
│   │   └── assistant.ts        # Integration with ASP Cranes Agent
│   │
│   ├── components/             # React components
│   │   └── assistance/
│   │       └── AIAssistance.tsx # AI assistant chat interface
│   │
│   ├── services/               
│   │   └── assistantService.ts # Service for AI assistant communication
│   │
│   └── pages/
│       └── AssistancePage.tsx  # Page containing the AI assistant
│
├── server.ts                   # Express server for API endpoints
└── .env.local                  # Environment configuration
```

## How the Integration Works

1. The ASP Cranes Agent runs as a Flask API server that exposes endpoints for chat interactions
2. The ASP CRM frontend communicates with this API server through an assistantService
3. The frontend displays a chat interface where users can interact with the AI agent
4. Conversations are stored in Firebase and session data is managed for continuity

## Setup Instructions

Follow the steps in the `INTEGRATION_GUIDE.md` file to set up both systems.

## Extending the System

This system can be extended in several ways:

### Adding a Database
1. Add database models to the Agent project
2. Extend the existing Firebase integration in the CRM

### Adding New Agent Features
1. Extend the tools in `customer_service/tools/tools.py`
2. Update prompts in `customer_service/prompts.py`
3. Ensure the API server handles the new capabilities

### CRM Enhancements
1. Extend existing pages or add new pages in the CRM
2. Ensure proper data flow between the CRM and Agent

## Maintenance

1. Keep dependencies updated
2. Regularly check logs for errors
3. Monitor API performance
4. Back up database and configuration files

## Contact

[Your contact information here]
