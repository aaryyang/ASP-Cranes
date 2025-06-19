# PostgreSQL Migration Plan for ASP Cranes CRM

## Overview

This document outlines the migration plan from Firebase Firestore to PostgreSQL for the ASP Cranes CRM system. The migration has been designed with a database abstraction layer to make the transition seamless.

## Current Status

- ✅ **Database Abstraction Layer Created**: `database_service.py` provides a unified interface
- ✅ **Firebase Wrapper Implemented**: `firebase_database_service.py` wraps existing Firebase functionality
- ✅ **PostgreSQL Stub Created**: `postgresql_database_service.py` ready for implementation
- ✅ **Code Refactored**: All Firebase calls now go through the abstraction layer
- ⏳ **PostgreSQL Implementation**: Waiting for database setup

## Architecture

### Current Architecture
```
Frontend (React) → Firebase SDK → Firestore
Backend (Python) → Firebase Admin SDK → Firestore
```

### Future Architecture
```
Frontend (React) → REST API → Database Abstraction Layer → PostgreSQL
Backend (Python) → Database Abstraction Layer → PostgreSQL
```

## Database Schema Mapping

### Firestore Collections → PostgreSQL Tables

| Firestore Collection | PostgreSQL Table | Notes |
|----------------------|------------------|-------|
| `users` | `users` | User authentication and profile data |
| `customers` | `customers` | Customer information and contacts |
| `leads` | `leads` | Sales leads and opportunities |
| `equipment` | `equipment` | Crane and equipment inventory |
| `jobs` | `jobs` | Scheduled jobs and assignments |
| `quotations` | `quotations` | Price quotes and proposals |
| `chat_history` | `chat_history` | AI assistant conversation history |

### Data Type Mappings

| Firestore Type | PostgreSQL Type | Example |
|----------------|-----------------|---------|
| `string` | `VARCHAR(n)` or `TEXT` | Names, descriptions |
| `number` | `INTEGER`, `DECIMAL`, `NUMERIC` | IDs, prices, weights |
| `boolean` | `BOOLEAN` | Status flags |
| `timestamp` | `TIMESTAMP` | Created/updated dates |
| `array` | `JSONB` | Equipment features, tags |
| `map/object` | `JSONB` | Nested data structures |
| `reference` | `UUID REFERENCES` | Foreign keys |

## Implementation Steps

### Phase 1: Backend Migration (When PostgreSQL is Ready)

1. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE asp_cranes_crm;
   
   -- Create extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

2. **Implement PostgreSQL Service**
   - Complete `postgresql_database_service.py`
   - Add SQLAlchemy models
   - Implement all abstract methods
   - Add database migrations

3. **Update Configuration**
   ```python
   # In .env or config
   DATABASE_TYPE=postgresql
   DATABASE_URL=postgresql://user:pass@host:port/database
   ```

4. **Switch Database Service**
   ```python
   # In factory
   db_service = DatabaseServiceFactory.get_service("postgresql")
   ```

### Phase 2: Frontend Migration

1. **Create API Endpoints**
   - Replace direct Firebase calls with REST API calls
   - Implement authentication middleware
   - Add caching layer if needed

2. **Update Services**
   - Modify `leadService.ts`, `equipmentService.ts`, etc.
   - Replace Firebase SDK calls with HTTP requests
   - Update error handling

3. **Authentication Migration**
   - Replace Firebase Auth with custom JWT implementation
   - Implement session management
   - Update auth middleware

### Phase 3: Data Migration

1. **Export Data from Firestore**
   ```python
   # Migration script
   from firebase_admin import firestore
   import json
   
   def export_collection(collection_name):
       db = firestore.client()
       docs = db.collection(collection_name).stream()
       data = []
       for doc in docs:
           doc_data = doc.to_dict()
           doc_data['id'] = doc.id
           data.append(doc_data)
       return data
   ```

2. **Transform and Import to PostgreSQL**
   ```python
   # Transform Firestore timestamps to PostgreSQL
   def transform_timestamp(timestamp):
       if hasattr(timestamp, 'timestamp'):
           return datetime.fromtimestamp(timestamp.timestamp())
       return timestamp
   ```

3. **Validate Data Integrity**
   - Compare record counts
   - Verify critical business data
   - Test application functionality

## File Changes Required

### Backend Files to Update

1. **Database Service Implementation**
   - `postgresql_database_service.py` - Complete implementation
   - `database_service.py` - Add any missing methods
   - `requirements.txt` - Add PostgreSQL dependencies

2. **Configuration**
   - `.env` - Add PostgreSQL connection string
   - `config.py` - Add database type selection

3. **Models (New)**
   - `models/user.py` - SQLAlchemy User model
   - `models/customer.py` - SQLAlchemy Customer model
   - `models/lead.py` - SQLAlchemy Lead model
   - `models/equipment.py` - SQLAlchemy Equipment model
   - `models/job.py` - SQLAlchemy Job model
   - `models/quotation.py` - SQLAlchemy Quotation model

### Frontend Files to Update

1. **Services**
   - `src/services/leadService.ts` - Replace Firebase with API calls
   - `src/services/equipmentService.ts` - Replace Firebase with API calls
   - `src/services/jobService.ts` - Replace Firebase with API calls
   - `src/services/customerService.ts` - Replace Firebase with API calls

2. **Authentication**
   - `src/lib/firebase.ts` - Replace with custom auth
   - `src/store/authStore.ts` - Update auth logic
   - `src/components/auth/` - Update login components

3. **Configuration**
   - `.env` - Update API endpoints
   - Remove Firebase config

## Dependencies

### Backend Dependencies to Add
```
# requirements.txt additions
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
alembic>=1.12.0  # For database migrations
asyncpg>=0.28.0  # If using async PostgreSQL
```

### Frontend Dependencies to Remove
```
# package.json removals
firebase
@firebase/app
@firebase/firestore
@firebase/auth
```

### Frontend Dependencies to Add
```
# package.json additions
axios  # For HTTP requests (if not already present)
```

## Environment Variables

### Backend Environment Variables
```bash
# Current (Firebase)
FIREBASE_PROJECT=ai-crm-database
FIREBASE_CREDENTIALS=firebase-service-account.json

# Future (PostgreSQL)
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://username:password@localhost:5432/asp_cranes_crm
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30
```

### Frontend Environment Variables
```bash
# Current (Firebase)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...

# Future (API)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AUTH_TOKEN_KEY=asp_cranes_auth_token
```

## Testing Strategy

### Unit Tests
- Database service abstract methods
- PostgreSQL implementation
- Data transformation functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### Migration Tests
- Data export/import validation
- Performance comparison
- Rollback procedures

## Rollback Plan

1. **Keep Firebase Active**: Maintain Firebase project during transition
2. **Dual Write**: Temporarily write to both databases
3. **Quick Switch**: Ability to switch back via environment variable
4. **Data Sync**: Scripts to sync PostgreSQL changes back to Firebase

## Performance Considerations

### Indexing Strategy
```sql
-- Critical indexes for performance
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_equipment_id ON jobs(equipment_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp);
```

### Connection Pooling
```python
# SQLAlchemy connection pool configuration
engine = create_engine(
    database_url,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600
)
```

## Security Considerations

1. **Connection Security**: Use SSL/TLS for database connections
2. **Access Control**: Implement row-level security (RLS) if needed
3. **Input Validation**: Sanitize all inputs to prevent SQL injection
4. **Audit Logging**: Track all database changes

## Monitoring and Observability

1. **Database Metrics**: Connection pool, query performance
2. **Error Tracking**: Database connection failures, query errors
3. **Performance Monitoring**: Slow query detection
4. **Health Checks**: Database connectivity monitoring

## Timeline Estimate

| Phase | Estimated Duration | Description |
|-------|-------------------|-------------|
| PostgreSQL Setup | 1-2 days | Database installation, user setup |
| Backend Implementation | 3-5 days | Complete PostgreSQL service |
| Testing & Validation | 2-3 days | Unit and integration tests |
| Frontend Migration | 2-3 days | Replace Firebase calls |
| Data Migration | 1-2 days | Export and import data |
| End-to-End Testing | 2-3 days | Full system testing |
| **Total** | **11-18 days** | **Complete migration** |

## Success Criteria

- ✅ All Firebase functionality replicated in PostgreSQL
- ✅ No data loss during migration
- ✅ Performance equal or better than Firebase
- ✅ All tests passing
- ✅ Frontend works seamlessly with new backend
- ✅ AI assistant retains chat history
- ✅ User authentication works correctly

## Contact and Support

- **Backend Developer**: Your friend (PostgreSQL implementation)
- **AI Integration**: GitHub Copilot assistance
- **Documentation**: This migration guide

---

*This migration plan is designed to be executed when your friend completes the PostgreSQL database setup. The abstraction layer is already in place, making the transition smooth and risk-free.*
