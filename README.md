# ASP Cranes AI Agent

An intelligent customer service agent for ASP Cranes heavy equipment rental company. This AI agent helps customers with equipment inquiries, bookings, pricing, and scheduling through natural language conversations.

## 🚀 Features

- **Intelligent Customer Service**: AI-powered responses to customer inquiries
- **Equipment Management**: Real-time access to crane inventory and availability
- **Lead Generation**: Automatic capture and processing of customer leads
- **CRM Integration**: Seamless integration with customer database
- **Multi-Database Support**: Firebase Firestore with PostgreSQL migration ready
- **Real-time Chat**: WebSocket-based chat interface
- **User Authentication**: Secure user identification and personalization

## 🏗️ Architecture

- **Frontend**: React TypeScript application with modern UI
- **Backend**: Python Flask API with Google ADK (Agent Development Kit)
- **AI Model**: Google Gemini 2.0 Flash via Vertex AI
- **Database**: Firebase Firestore (with PostgreSQL abstraction layer)
- **Authentication**: Firebase Auth integration

## 📁 Project Structure

```
ASP-Cranes-Agent/
├── packages/
│   ├── agent/                    # Python AI Agent Backend
│   │   ├── robust_api_server.py  # Main API server
│   │   ├── customer_service/     # Agent logic and tools
│   │   │   ├── agent.py          # Core agent implementation
│   │   │   ├── config.py         # Configuration management
│   │   │   ├── tools/            # CRM integration tools
│   │   │   ├── integrations/     # Database abstractions
│   │   │   └── shared_libraries/ # Shared utilities
│   │   ├── .env                  # Environment configuration
│   │   └── requirements.txt      # Python dependencies
│   └── crm/                      # React Frontend (CRM Dashboard)
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── services/         # API services
│       │   ├── pages/            # Application pages
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
    "message": "I need a 30-ton crane for tomorrow",
    "user_id": "customer@example.com",
    "crm_access": true
  }
  ```

- **Health Check**: `GET /`

### Example Chat Interaction

```bash
curl -X POST http://localhost:5000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What cranes do you have available?",
    "user_id": "test@aspcranes.com",
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

### Adding New Tools
1. Add tool function to `packages/agent/customer_service/tools/tools.py`
2. Register tool in agent configuration
3. Test with API calls

### Database Operations
Use the database abstraction layer:
```python
from customer_service.integrations.database_service import DatabaseServiceFactory

db_service = DatabaseServiceFactory.get_default_service()
equipment = db_service.get_available_equipment()
```

## 📄 License

This project is proprietary software for ASP Cranes.

## 🆘 Support

For technical support or questions:
- Check the documentation in `packages/agent/POSTGRESQL_MIGRATION_PLAN.md`
- Test with the provided test scripts

---

**Built with ❤️ for ASP Cranes heavy equipment rental solutions**
- Required dependencies (run `npm install` in the root and `pip install -r requirements_crm.txt` in packages/agent)
