# ASP Cranes Agent CRM Integration Setup

This guide will help you run both the ASP Cranes Agent API server and the CRM frontend.

## Prerequisites

- Python 3.8+ installed for the Agent API
- Node.js 16+ installed for the CRM frontend

## Starting the Agent API Server

1. Open a terminal window and navigate to the ASP Cranes Agent directory:

```bash
cd c:\Users\Admin\Downloads\ASP-Cranes-Agent
```

2. Make sure all dependencies are installed:

```bash
pip install -r requirements_crm.txt
```

3. Start the API server:

```bash
python robust_api_server.py
# OR use the regular API server if preferred
# python api_server.py
```

The API server will be available at http://localhost:5000

## Starting the CRM Frontend

1. Open a new terminal window and navigate to the CRM directory:

```bash
cd c:\Users\Admin\Downloads\ASP-Latest-CRM-master
```

2. Install frontend dependencies:

```bash
npm install
# OR
yarn install
```

3. Start the development server:

```bash
npm run dev
# OR
yarn dev
```

The CRM will be available at http://localhost:5173 or similar (check console output)

## Testing the Integration

1. Open the CRM in your browser
2. Navigate to the AI Assistance page
3. Type a message and press enter or click the send button
4. You should receive a response from the ASP Cranes Agent

## Troubleshooting

- If the agent doesn't respond, check both terminal windows for error messages
- Verify that both servers are running correctly
- Check browser console for any frontend errors
- Verify that the API URL in .env.local is correct
