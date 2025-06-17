import express from 'express';
import cors from 'cors';
import { handleAssistantRequest } from './src/api/assistant';
import { handleLeadSubmission } from './src/api/leads';
import { handleQuotationSubmission } from './src/api/quotations';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/assistant', handleAssistantRequest);
app.post('/api/leads', handleLeadSubmission);
app.post('/api/quotations', handleQuotationSubmission);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});