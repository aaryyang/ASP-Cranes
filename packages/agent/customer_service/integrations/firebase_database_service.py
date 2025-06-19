"""
Firebase implementation of the DatabaseService interface.

This module wraps the existing Firebase functionality to provide a consistent
interface that can be easily replaced with PostgreSQL in the future.

Author: ASP Cranes Agent Team
Date: 2025
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from .database_service import DatabaseService
from .firebase_service import firebase_service

logger = logging.getLogger(__name__)

class FirebaseDatabaseService(DatabaseService):
    """Firebase implementation of the DatabaseService interface"""
    
    def __init__(self):
        self.firebase_service = firebase_service
        self._initialized = False
    
    def initialize(self) -> None:
        """Initialize the Firebase connection"""
        if not self._initialized:
            self.firebase_service.initialize()
            self._initialized = True
    
    # User Management
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their ID"""
        try:
            self.initialize()
            return self.firebase_service.get_user_by_id(user_id)
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Create a new user and return the user ID"""
        try:
            self.initialize()
            # Firebase doesn't have a specific create_user method, so we'll implement it
            from firebase_admin import firestore
            
            # Add timestamp fields
            user_data['createdAt'] = firestore.SERVER_TIMESTAMP
            user_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Create user document
            user_ref = self.firebase_service.db.collection('users').document()
            user_ref.set(user_data)
            
            logger.info(f"Created user with ID: {user_ref.id}")
            return user_ref.id
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Update an existing user"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add updated timestamp
            user_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update user document
            user_ref = self.firebase_service.db.collection('users').document(user_id)
            user_ref.update(user_data)
            
            logger.info(f"Updated user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return False
    
    # Customer Management
    def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by their ID"""
        try:
            self.initialize()
            return self.firebase_service.get_customer_by_id(customer_id)
        except Exception as e:
            logger.error(f"Error getting customer by ID: {e}")
            return None
    
    def get_customers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of customers"""
        try:
            self.initialize()
            return self.firebase_service.get_customers(limit)
        except Exception as e:
            logger.error(f"Error getting customers: {e}")
            return []
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Optional[str]:
        """Create a new customer and return the customer ID"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add timestamp fields
            customer_data['createdAt'] = firestore.SERVER_TIMESTAMP
            customer_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Create customer document
            customer_ref = self.firebase_service.db.collection('customers').document()
            customer_ref.set(customer_data)
            
            logger.info(f"Created customer with ID: {customer_ref.id}")
            return customer_ref.id
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            return None
    
    def update_customer(self, customer_id: str, customer_data: Dict[str, Any]) -> bool:
        """Update an existing customer"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add updated timestamp
            customer_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update customer document
            customer_ref = self.firebase_service.db.collection('customers').document(customer_id)
            customer_ref.update(customer_data)
            
            logger.info(f"Updated customer: {customer_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            return False
    
    # Lead Management
    def get_leads(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of leads"""
        try:
            self.initialize()
            return self.firebase_service.get_leads(limit)
        except Exception as e:
            logger.error(f"Error getting leads: {e}")
            return []
    
    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get a lead by its ID"""
        try:
            self.initialize()
            lead_doc = self.firebase_service.db.collection('leads').document(lead_id).get()
            if lead_doc.exists:
                lead_data = lead_doc.to_dict()
                lead_data['id'] = lead_doc.id
                return lead_data
            return None
        except Exception as e:
            logger.error(f"Error getting lead by ID: {e}")
            return None
    
    def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """Create a new lead and return the lead ID"""
        try:
            self.initialize()
            return self.firebase_service.create_lead(lead_data)
        except Exception as e:
            logger.error(f"Error creating lead: {e}")
            return None
    
    def update_lead(self, lead_id: str, lead_data: Dict[str, Any]) -> bool:
        """Update an existing lead"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add updated timestamp
            lead_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update lead document
            lead_ref = self.firebase_service.db.collection('leads').document(lead_id)
            lead_ref.update(lead_data)
            
            logger.info(f"Updated lead: {lead_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating lead: {e}")
            return False
    
    def get_leads_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all leads for a specific customer"""
        try:
            self.initialize()
            query = self.firebase_service.db.collection('leads').where('customerId', '==', customer_id)
            docs = query.stream()
            
            leads = []
            for doc in docs:
                lead_data = doc.to_dict()
                lead_data['id'] = doc.id
                leads.append(lead_data)
            
            return leads
        except Exception as e:
            logger.error(f"Error getting leads by customer: {e}")
            return []
    
    # Equipment Management
    def get_equipment(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get a list of equipment, optionally filtered by status"""
        try:
            self.initialize()
            return self.firebase_service.get_equipment(status)
        except Exception as e:
            logger.error(f"Error getting equipment: {e}")
            return []
    
    def get_available_equipment(self) -> List[Dict[str, Any]]:
        """Get a list of available equipment"""
        try:
            self.initialize()
            return self.firebase_service.get_available_equipment()
        except Exception as e:
            logger.error(f"Error getting available equipment: {e}")
            return []
    
    def get_equipment_by_id(self, equipment_id: str) -> Optional[Dict[str, Any]]:
        """Get equipment by its ID"""
        try:
            self.initialize()
            equipment_doc = self.firebase_service.db.collection('equipment').document(equipment_id).get()
            if equipment_doc.exists:
                equipment_data = equipment_doc.to_dict()
                equipment_data['id'] = equipment_doc.id
                return equipment_data
            return None
        except Exception as e:
            logger.error(f"Error getting equipment by ID: {e}")
            return None
    
    def update_equipment_status(self, equipment_id: str, status: str) -> bool:
        """Update equipment status"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Update equipment status
            equipment_ref = self.firebase_service.db.collection('equipment').document(equipment_id)
            equipment_ref.update({
                'status': status,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
            logger.info(f"Updated equipment {equipment_id} status to: {status}")
            return True
        except Exception as e:
            logger.error(f"Error updating equipment status: {e}")
            return False
    
    # Job Management
    def get_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of jobs"""
        try:
            self.initialize()
            return self.firebase_service.get_jobs(limit)
        except Exception as e:
            logger.error(f"Error getting jobs: {e}")
            return []
    
    def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job by its ID"""
        try:
            self.initialize()
            job_doc = self.firebase_service.db.collection('jobs').document(job_id).get()
            if job_doc.exists:
                job_data = job_doc.to_dict()
                job_data['id'] = job_doc.id
                return job_data
            return None
        except Exception as e:
            logger.error(f"Error getting job by ID: {e}")
            return None
    
    def schedule_job(self, job_data: Dict[str, Any]) -> Optional[str]:
        """Schedule a new job and return the job ID"""
        try:
            self.initialize()
            return self.firebase_service.schedule_job(job_data)
        except Exception as e:
            logger.error(f"Error scheduling job: {e}")
            return None
    
    def update_job(self, job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update an existing job"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add updated timestamp
            job_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update job document
            job_ref = self.firebase_service.db.collection('jobs').document(job_id)
            job_ref.update(job_data)
            
            logger.info(f"Updated job: {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating job: {e}")
            return False
    
    def get_jobs_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all jobs for a specific customer"""
        try:
            self.initialize()
            query = self.firebase_service.db.collection('jobs').where('customerId', '==', customer_id)
            docs = query.stream()
            
            jobs = []
            for doc in docs:
                job_data = doc.to_dict()
                job_data['id'] = doc.id
                jobs.append(job_data)
            
            return jobs
        except Exception as e:
            logger.error(f"Error getting jobs by customer: {e}")
            return []
    
    def get_jobs_by_equipment(self, equipment_id: str) -> List[Dict[str, Any]]:
        """Get all jobs for specific equipment"""
        try:
            self.initialize()
            query = self.firebase_service.db.collection('jobs').where('equipmentId', '==', equipment_id)
            docs = query.stream()
            
            jobs = []
            for doc in docs:
                job_data = doc.to_dict()
                job_data['id'] = doc.id
                jobs.append(job_data)
            
            return jobs
        except Exception as e:
            logger.error(f"Error getting jobs by equipment: {e}")
            return []
    
    # Quotation Management
    def get_quotations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of quotations"""
        try:
            self.initialize()
            quotations = []
            query = self.firebase_service.db.collection('quotations').limit(limit)
            docs = query.stream()
            
            for doc in docs:
                quotation_data = doc.to_dict()
                quotation_data['id'] = doc.id
                quotations.append(quotation_data)
            
            return quotations
        except Exception as e:
            logger.error(f"Error getting quotations: {e}")
            return []
    
    def get_quotation_by_id(self, quotation_id: str) -> Optional[Dict[str, Any]]:
        """Get a quotation by its ID"""
        try:
            self.initialize()
            quotation_doc = self.firebase_service.db.collection('quotations').document(quotation_id).get()
            if quotation_doc.exists:
                quotation_data = quotation_doc.to_dict()
                quotation_data['id'] = quotation_doc.id
                return quotation_data
            return None
        except Exception as e:
            logger.error(f"Error getting quotation by ID: {e}")
            return None
    
    def create_quotation(self, quotation_data: Dict[str, Any]) -> Optional[str]:
        """Create a new quotation and return the quotation ID"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add timestamp fields
            quotation_data['createdAt'] = firestore.SERVER_TIMESTAMP
            quotation_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Create quotation document
            quotation_ref = self.firebase_service.db.collection('quotations').document()
            quotation_ref.set(quotation_data)
            
            logger.info(f"Created quotation with ID: {quotation_ref.id}")
            return quotation_ref.id
        except Exception as e:
            logger.error(f"Error creating quotation: {e}")
            return None
    
    def update_quotation(self, quotation_id: str, quotation_data: Dict[str, Any]) -> bool:
        """Update an existing quotation"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add updated timestamp
            quotation_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update quotation document
            quotation_ref = self.firebase_service.db.collection('quotations').document(quotation_id)
            quotation_ref.update(quotation_data)
            
            logger.info(f"Updated quotation: {quotation_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating quotation: {e}")
            return False
    
    # Chat History Management (for AI assistant)
    def save_chat_message(self, user_id: str, message: Dict[str, Any]) -> Optional[str]:
        """Save a chat message and return the message ID"""
        try:
            self.initialize()
            from firebase_admin import firestore
            
            # Add timestamp and user info
            message['userId'] = user_id
            message['timestamp'] = firestore.SERVER_TIMESTAMP
            
            # Save to chat_history collection
            message_ref = self.firebase_service.db.collection('chat_history').document()
            message_ref.set(message)
            
            logger.info(f"Saved chat message for user: {user_id}")
            return message_ref.id
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
            return None
    
    def get_chat_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a user"""
        try:
            self.initialize()
            query = (self.firebase_service.db.collection('chat_history')
                    .where('userId', '==', user_id)
                    .order_by('timestamp')
                    .limit(limit))
            docs = query.stream()
            
            messages = []
            for doc in docs:
                message_data = doc.to_dict()
                message_data['id'] = doc.id
                messages.append(message_data)
            
            return messages
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []
    
    def clear_chat_history(self, user_id: str) -> bool:
        """Clear chat history for a user"""
        try:
            self.initialize()
            # Get all messages for the user
            query = self.firebase_service.db.collection('chat_history').where('userId', '==', user_id)
            docs = query.stream()
            
            # Delete each message
            for doc in docs:
                doc.reference.delete()
            
            logger.info(f"Cleared chat history for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing chat history: {e}")
            return False
    
    # Utility Methods
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics for debugging"""
        try:
            self.initialize()
            stats = {
                'database_type': 'Firebase Firestore',
                'connected': True,
                'collections': {}
            }
            
            # Count documents in each collection
            collections = ['users', 'customers', 'leads', 'equipment', 'jobs', 'quotations', 'chat_history']
            for collection_name in collections:
                try:
                    docs = list(self.firebase_service.db.collection(collection_name).stream())
                    stats['collections'][collection_name] = len(docs)
                except Exception as e:
                    stats['collections'][collection_name] = f"Error: {str(e)}"
            
            return stats
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {
                'database_type': 'Firebase Firestore',
                'connected': False,
                'error': str(e)
            }
    
    def health_check(self) -> bool:
        """Check if the database connection is healthy"""
        try:
            self.initialize()
            # Try a simple read operation
            test_collection = self.firebase_service.db.collection('users').limit(1)
            list(test_collection.stream())
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
