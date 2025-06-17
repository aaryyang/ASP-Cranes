# ASP Cranes Complete Solution

This repository contains both the ASP Cranes Agent (backend) and CRM (frontend) components.

## Project Structure

- `packages/agent`: Python-based AI agent built with Google ADK
- `packages/crm`: TypeScript/React CRM system

## Getting Started

1. Start the agent:
   ```
   npm run start:agent
   ```

2. Start the CRM:
   ```
   npm run start:crm
   ```

3. Or start both together:
   ```
   npm start
   ```

## Prerequisites

- Python 3.8+ for the agent
- Node.js 16+ for the CRM
- Required dependencies (run `npm install` in the root and `pip install -r requirements_crm.txt` in packages/agent)
