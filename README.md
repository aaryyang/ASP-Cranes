# ASP Cranes AI Sales Agent

An intelligent sales agent for ASP Cranes heavy equipment rental company. This AI agent assists sales staff with lead analysis, quotation generation, equipment scheduling, and CRM operations through natural language conversations.

## 🚀 Features

- **Sales Assistant**: AI-powered assistance for sales staff with lead analysis and quotations
- **Lead Management**: Automated lead qualification, prioritization, and follow-up recommendations
- **Equipment Availability**: Real-time access to crane inventory and scheduling
- **Quotation Generation**: Automated pricing calculations with GST and comprehensive quotes
- **CRM Integration**: Seamless integration with customer and lead databases
- **Sales Analytics**: Equipment utilization analysis and sales performance insights
- **Multi-Database Support**: Firebase Firestore with PostgreSQL migration ready
- **Real-time Dashboard**: Modern CRM interface for sales team operations
- **User Authentication**: Role-based access for sales staff and managers

## 🏗️ Architecture

- **Frontend**: React TypeScript CRM Dashboard with modern UI
- **Backend**: Python Flask API with Google ADK (Agent Development Kit)
- **AI Model**: Google Gemini 2.0 Flash via Vertex AI (Sales-focused prompting)
- **Database**: Firebase Firestore (with PostgreSQL abstraction layer)
- **Authentication**: Firebase Auth integration with role-based access

## 📁 Project Structure

```
ASP-Cranes-Agent/
├── packages/
│   ├── agent/                    # Python AI Sales Agent Backend
│   │   ├── robust_api_server.py  # Main API server
│   │   ├── sales_service/       # Sales agent logic and tools
│   │   │   ├── agent.py          # Core sales agent implementation
│   │   │   ├── config.py         # Configuration management
│   │   │   ├── tools/            # Sales tools (quotation, pricing, scheduling)
│   │   │   ├── integrations/     # CRM and database abstractions
│   │   │   └── shared_libraries/ # Shared utilities
│   │   ├── .env                  # Environment configuration
│   │   └── requirements.txt      # Python dependencies
│   └── crm/                      # React Frontend (Sales CRM Dashboard)
│       ├── src/
│       │   ├── components/       # React components (sales interface)
│       │   ├── services/         # API services
│       │   ├── pages/            # Sales application pages
│       │   └── types/            # TypeScript definitions
│       ├── package.json          # Node.js dependencies
│       └── vite.config.ts        # Vite configuration
└── README.md                     # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Cloud Project with Vertex AI enabled
- Firebase project with Firestore

### Backend Setup

1. **Navigate to agent directory**:
   ```bash
   cd packages/agent
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up Google Cloud credentials**:
   - Place your Vertex AI service account JSON as `service-account.json`
   - Place your Firebase service account JSON as `firebase-service-account.json`

5. **Start the API server**:
   ```bash
   python robust_api_server.py
   ```

### Frontend Setup

1. **Navigate to CRM directory**:
   ```bash
   cd packages/crm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database Configuration
DATABASE_TYPE=firebase
FIREBASE_PROJECT=your-crm-project-id
FIREBASE_CREDENTIALS=firebase-service-account.json

# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=your-ai-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=service-account.json

# API Configuration
FLASK_ENV=development
```

#### Frontend (.env)
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
```

## 🤖 Usage

### API Endpoints

- **Chat**: `POST /agent/chat`
  ```json
  {
    "message": "Can you help me analyze this lead? Customer wants a crane for residential project, budget under ₹20 lakhs",
    "user_id": "sales@aspcranes.com",
    "crm_access": true
  }
  ```

- **Health Check**: `GET /`

### Example Sales Agent Interaction

```bash
curl -X POST http://localhost:5000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this lead: residential project, ₹15 lakh budget, needs crane next week",
    "user_id": "sales@aspcranes.com",
    "crm_access": true
  }'
```

## 🧪 Testing

Test the API with the included test script:

```bash
cd packages/agent
python test_api.py
```

## 🔄 Database Migration

The project includes a database abstraction layer for easy migration from Firebase to PostgreSQL:

1. **Current**: Firebase Firestore
2. **Future**: PostgreSQL (ready to switch)
3. **Migration Guide**: See `packages/agent/POSTGRESQL_MIGRATION_PLAN.md`

To switch databases:
```bash
# Update .env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:pass@host:port/database
```

## 🚀 Deployment

### Backend Deployment
- Deploy to Google Cloud Run, AWS Lambda, or similar
- Ensure environment variables are configured
- Set up proper authentication and CORS

### Frontend Deployment
- Build: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Configure environment variables for production

## 🔧 Development

### Adding New Sales Tools
1. Add tool function to `packages/agent/sales_service/tools/tools.py`
2. Register tool in agent configuration
3. Test with API calls

### Sales Operations
Use the database abstraction layer for sales operations:
```python
from sales_service.integrations.database_service import DatabaseServiceFactory

db_service = DatabaseServiceFactory.get_default_service()
equipment = db_service.get_available_equipment()
leads = db_service.get_leads()
```

## 📄 License

This project is proprietary software for ASP Cranes.

## 🆘 Support

For technical support or questions:
- Check the documentation in `packages/agent/POSTGRESQL_MIGRATION_PLAN.md`
- Test with the provided test scripts

---

**Built with ❤️ for ASP Cranes sales team and heavy equipment rental solutions**
- Required dependencies (run `npm install` in the root and `pip install -r requirements_crm.txt` in packages/agent)
