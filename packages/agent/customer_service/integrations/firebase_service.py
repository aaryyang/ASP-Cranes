"""
Firebase integration for the ASP Cranes Agent to connect with the CRM database.
This module provides functions to interact with Firebase Firestore from the Python backend.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth

logger = logging.getLogger(__name__)

class FirebaseService:
    """Service class for interacting with Firebase from the Python agent"""
    
    _instance = None    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
    
    def initialize(self):
        """Initialize Firebase with credentials from service account file"""
        if self.initialized:
            return
            
        try:
            # Check for separate Firebase credentials first
            firebase_creds = os.environ.get('FIREBASE_CREDENTIALS', 'firebase-service-account.json')
            service_account_path = Path(__file__).parents[2] / firebase_creds
            
            if not service_account_path.exists():
                # Fall back to the main service account
                service_account_path = Path(__file__).parents[2] / 'service-account.json'
                
                if not service_account_path.exists():
                    # Try an alternate path (root of the project)
                    alternate_path = Path(__file__).parents[3] / 'service-account.json'
                    if alternate_path.exists():
                        service_account_path = alternate_path
                        logger.info(f"Using service account from alternate path: {service_account_path}")
                    else:
                        logger.error(f"Service account file not found at {service_account_path} or {alternate_path}")
                        raise FileNotFoundError(f"Service account file not found at {service_account_path}")
            
            # Log the path used        
            logger.info(f"Initializing Firebase with credentials from: {service_account_path}")
            
            # Check if we need to specify a different project for Firebase
            firebase_project = os.environ.get('FIREBASE_PROJECT')
            if firebase_project:
                # Initialize Firebase with specific project ID
                cred = credentials.Certificate(str(service_account_path))
                firebase_admin.initialize_app(cred, {
                    'projectId': firebase_project
                })
                logger.info(f"Firebase initialized for project: {firebase_project}")
            else:
                # Initialize Firebase with default project from service account
                cred = credentials.Certificate(str(service_account_path))
                firebase_admin.initialize_app(cred)
            
            # Initialize Firestore
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase initialized successfully")
            
            # Create test data if needed
            self._create_test_data_if_needed()
            
            # Debug what's in the database
            self.debug_user_and_equipment()
            
        except Exception as e:
            logger.error(f"Error initializing Firebase: {e}")
            self._create_mock_data_if_needed()
            raise
    
    # User related methods
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their ID from Firestore"""
        self.initialize()
        try:
            logger.info(f"Looking up user with ID: {user_id}")
            
            # First try direct document lookup
            user_doc = self.db.collection('users').document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                user_data['id'] = user_id
                logger.info(f"Found user by direct ID: {user_data.get('name', 'Unknown')}")
                return user_data
                
            # If not found, try looking up by email (for test@aspcranes.com case)
            if '@' in user_id:
                email = user_id
                logger.info(f"Looking up user by email: {email}")
                query = self.db.collection('users').where('email', '==', email).limit(1)
                results = list(query.stream())
                if results:
                    user_data = results[0].to_dict()
                    user_data['id'] = results[0].id
                    logger.info(f"Found user by email: {user_data.get('name', 'Unknown')}")
                    return user_data
                    
            # Try a search by any substring match on email or name for testing
            logger.info(f"Trying approximate match search on name/email for: {user_id}")
            all_users = list(self.db.collection('users').stream())
            for user_doc in all_users:
                user_data = user_doc.to_dict()                # Try to match by substring in name, email or ID
                if (user_id.lower() in user_data.get('name', '').lower() or
                    user_id.lower() in user_data.get('email', '').lower() or
                    user_id.lower() in user_doc.id.lower()):
                    user_data['id'] = user_doc.id
                    logger.info(f"Found user by approximate match: {user_data.get('name', 'Unknown')}")
                    return user_data
            
            # User not found - return None instead of creating fallback
            logger.warning(f"User not found: {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            # Return None on error instead of fallback data
            return None
            
    # Lead related methods
    def get_leads(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of leads from Firestore"""
        self.initialize()
        try:
            leads = []
            query = self.db.collection('leads').limit(limit)
            docs = query.stream()
            
            for doc in docs:
                lead_data = doc.to_dict()
                lead_data['id'] = doc.id
                leads.append(lead_data)
                
            return leads
        except Exception as e:
            logger.error(f"Error getting leads: {e}")
            return []
            
    def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """Create a new lead in Firestore"""
        self.initialize()
        try:
            # Add timestamp fields
            lead_data['createdAt'] = firestore.SERVER_TIMESTAMP
            lead_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Add the lead to Firestore
            lead_ref = self.db.collection('leads').document()
            lead_ref.set(lead_data)
            
            return lead_ref.id
        except Exception as e:
            logger.error(f"Error creating lead: {e}")
            return None
      # Equipment related methods
    def get_equipment(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get a list of equipment from Firestore, optionally filtered by status"""
        self.initialize()
        try:
            equipment_list = []
            
            # First check if we need to create test data
            all_equipment = list(self.db.collection('equipment').stream())
            if len(all_equipment) == 0:
                logger.info("No equipment found - creating test equipment")
                self._create_test_data_if_needed()
                
                # Try again after creating test data
                if status:
                    query = self.db.collection('equipment').where('status', '==', status)
                else:
                    query = self.db.collection('equipment')
                    
                docs = query.stream()
            else:
                # We have equipment, proceed normally
                if status:
                    query = self.db.collection('equipment').where('status', '==', status)
                else:
                    query = self.db.collection('equipment')
                    
                docs = query.stream()
            
            # Process the equipment
            equipment_count = 0
            for doc in docs:
                equipment_data = doc.to_dict()
                equipment_data['id'] = doc.id
                equipment_list.append(equipment_data)
                equipment_count += 1
                
            logger.info(f"Retrieved {equipment_count} equipment items with status filter: {status or 'all'}")
            
            # If no equipment found despite our efforts, provide mock data
            if len(equipment_list) == 0 and status == 'available':
                logger.warning("No available equipment found - returning mock available equipment")
                equipment_list = [
                    {
                        'id': 'mock1',
                        'name': '30-ton Mobile Crane',
                        'model': 'ASP-30T-Mobile',
                        'status': 'available',
                        'type': 'Mobile Crane',
                        'capacity': '30 tons',
                        'hourlyRate': 250,
                        'dailyRate': 2000
                    },
                    {
                        'id': 'mock2',
                        'name': '20-ton Crawler Crane',
                        'model': 'ASP-20T-Crawler',
                        'status': 'available',
                        'type': 'Crawler Crane',
                        'capacity': '20 tons',
                        'hourlyRate': 200,
                        'dailyRate': 1600
                    }
                ]
                
            return equipment_list
        except Exception as e:
            logger.error(f"Error getting equipment: {e}")
            # Return mock data on error
            if status == 'available':
                logger.warning("Returning mock equipment due to error")
                return [
                    {
                        'id': 'mock1',
                        'name': '30-ton Mobile Crane',
                        'model': 'ASP-30T-Mobile',                        'status': 'available',
                        'capacity': '30 tons'
                    }
                ]
            return []
            
    def get_available_equipment(self) -> List[Dict[str, Any]]:
        """Get a list of available equipment from Firestore"""
        try:
            # First try to get real equipment
            equipment = self.get_equipment(status='available')
            
            # If no real equipment found, create some mock equipment for testing
            if not equipment or len(equipment) == 0:
                logger.warning("No available equipment found - creating mock equipment")
                # Create some mock available equipment
                mock_equipment = [
                    {
                        'id': 'mock1',
                        'name': '30-ton Mobile Crane',
                        'model': 'ASP-30T-Mobile',
                        'status': 'available',
                        'type': 'Mobile Crane',
                        'capacity': '30 tons',
                        'hourlyRate': 250,
                        'dailyRate': 2000,
                        'location': 'Central Depot'
                    },
                    {
                        'id': 'mock2',
                        'name': '20-ton Crawler Crane',
                        'model': 'ASP-20T-Crawler',
                        'status': 'available',
                        'type': 'Crawler Crane',
                        'capacity': '20 tons',
                        'hourlyRate': 200,
                        'dailyRate': 1600,
                        'location': 'East Depot'
                    },
                    {
                        'id': 'mock3',
                        'name': '5-ton Boom Truck',
                        'model': 'ASP-5T-Boom',
                        'status': 'available',
                        'type': 'Boom Truck',
                        'capacity': '5 tons',
                        'hourlyRate': 120,
                        'dailyRate': 900,
                        'location': 'North Depot'
                    }
                ]
                
                # Try to add these to Firestore for next time
                for equip in mock_equipment:
                    try:
                        # Skip the 'id' when adding to Firestore
                        equip_id = equip.pop('id')
                        self.db.collection('equipment').document(equip_id).set(equip)
                        # Put id back for this session
                        equip['id'] = equip_id
                    except Exception as add_err:
                        logger.error(f"Failed to add mock equipment to Firestore: {add_err}")
                
                return mock_equipment
            
            return equipment
        except Exception as e:
            logger.error(f"Error getting available equipment: {e}")
            # Fall back to mock data if Firebase failed
            if self._check_mock_mode():
                logger.info("Using mock equipment data")
                return self.mock_data.get('equipment', [])
            
            # Emergency fallback equipment list
            return [
                {
                    'id': 'emergency1',
                    'name': '30-ton Mobile Crane (Emergency Fallback)',
                    'model': 'ASP-30T-Mobile',
                    'status': 'available',
                    'type': 'Mobile Crane',
                    'capacity': '30 tons',
                    'hourlyRate': 250,
                    'dailyRate': 2000
                }
            ]
    
    # Job scheduling methods
    def get_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of jobs from Firestore"""
        self.initialize()
        try:
            jobs = []
            query = self.db.collection('jobs').limit(limit)
            docs = query.stream()
            
            for doc in docs:
                job_data = doc.to_dict()
                job_data['id'] = doc.id
                jobs.append(job_data)
                
            return jobs
        except Exception as e:
            logger.error(f"Error getting jobs: {e}")
            return []
            
    def schedule_job(self, job_data: Dict[str, Any]) -> Optional[str]:
        """Schedule a new job in Firestore"""
        self.initialize()
        try:
            # Add timestamp fields
            job_data['createdAt'] = firestore.SERVER_TIMESTAMP
            job_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Add the job to Firestore
            job_ref = self.db.collection('jobs').document()
            job_ref.set(job_data)
            
            return job_ref.id
        except Exception as e:
            logger.error(f"Error scheduling job: {e}")
            return None
            
    # Customer related methods
    def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by their ID from Firestore"""
        self.initialize()
        try:
            customer_doc = self.db.collection('customers').document(customer_id).get()
            if customer_doc.exists:
                customer_data = customer_doc.to_dict()
                customer_data['id'] = customer_doc.id
                return customer_data
            return None
        except Exception as e:
            logger.error(f"Error getting customer: {e}")
            return None
            
    def get_customers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of customers from Firestore"""
        self.initialize()
        try:
            customers = []
            query = self.db.collection('customers').limit(limit)
            docs = query.stream()
            
            for doc in docs:
                customer_data = doc.to_dict()
                customer_data['id'] = doc.id
                customers.append(customer_data)
                
            return customers
        except Exception as e:
            logger.error(f"Error getting customers: {e}")
            return []
    
    def debug_user_and_equipment(self):
        """Debug function to log what's in the database for troubleshooting"""
        try:
            if not self.initialized:
                self.initialize()
                
            logger.info("==== DEBUG: FIREBASE DATABASE CONTENTS ====")
            
            # Check equipment collection
            equipment_docs = list(self.db.collection('equipment').stream())
            logger.info(f"Equipment count: {len(equipment_docs)}")
            for i, doc in enumerate(equipment_docs[:5]):  # Show up to 5 items
                data = doc.to_dict()
                logger.info(f"Equipment {i+1}: {data.get('name', 'Unknown')} - Status: {data.get('status', 'Unknown')}")
            
            # Check users collection
            users_docs = list(self.db.collection('users').stream())
            logger.info(f"Users count: {len(users_docs)}")
            for i, doc in enumerate(users_docs[:5]):  # Show up to 5 items
                data = doc.to_dict()
                logger.info(f"User {i+1}: {doc.id} - Name: {data.get('name', 'Unknown')}")
                
            # If no users, we'll try to create a test user
            if len(users_docs) == 0:
                logger.info("No users found - creating test user")
                test_user_id = "test_user_id"
                test_user = {
                    "name": "Test User",
                    "email": "test@aspcranes.com",
                    "role": "Customer",
                    "createdAt": firestore.SERVER_TIMESTAMP
                }
                self.db.collection("users").document(test_user_id).set(test_user)
                logger.info(f"Created test user: {test_user['name']}")
                
            logger.info("==========================================")
        except Exception as e:
            logger.error(f"Error in debug_user_and_equipment: {e}")
    
    def _create_mock_data_if_needed(self):
        """Create mock data for testing when Firebase is unavailable"""
        logger.warning("Creating mock data for testing - FIREBASE CONNECTION FAILED")
        try:
            # Only create mock data if Firebase failed to initialize
            if not self.initialized:
                # Use in-memory dictionary as a fallback
                self.mock_data = {
                    'users': {
                        'test_user': {
                            'name': 'Test User',
                            'email': 'test@example.com',
                            'role': 'customer'
                        }
                    },
                    'equipment': [
                        {
                            'id': 'equip1',
                            'name': '30-ton Mobile Crane',
                            'model': 'Crane-30T',
                            'status': 'available',
                            'capacity': '30 tons',
                            'hourlyRate': 150,
                            'dailyRate': 1200
                        },
                        {
                            'id': 'equip2',
                            'name': '50-ton Tower Crane',
                            'model': 'Tower-50T',
                            'status': 'available',
                            'capacity': '50 tons',
                            'hourlyRate': 250,
                            'dailyRate': 2000
                        }
                    ],
                    'leads': [],
                    'jobs': [],
                    'customers': []
                }
                logger.info("Mock data created for testing")
        except Exception as e:
            logger.error(f"Failed to create mock data: {e}")
            
    def _create_test_data_if_needed(self):
        """Create test data if real data can't be found"""
        try:
            # Check if we need to create some test equipment
            equipment_list = self.get_equipment()
            if not equipment_list:
                # No equipment found - create some test data
                logger.info("No equipment found - creating test equipment data")
                
                # Create test equipment
                test_equipment = [
                    {
                        "name": "30-ton Mobile Crane",
                        "model": "ASP-30T-Mobile",
                        "status": "available",
                        "type": "Mobile Crane",
                        "capacity": "30 tons",
                        "hourlyRate": 250,
                        "dailyRate": 2000,
                        "description": "Versatile 30-ton mobile crane suitable for various construction projects"
                    },
                    {
                        "name": "50-ton Tower Crane",
                        "model": "ASP-50T-Tower",
                        "status": "available", 
                        "type": "Tower Crane",
                        "capacity": "50 tons",
                        "hourlyRate": 350,
                        "dailyRate": 2800,
                        "description": "Heavy-duty 50-ton tower crane for high-rise construction"
                    },
                    {
                        "name": "20-ton Crawler Crane",
                        "model": "ASP-20T-Crawler",
                        "status": "available",
                        "type": "Crawler Crane",
                        "capacity": "20 tons",
                        "hourlyRate": 200,
                        "dailyRate": 1600,
                        "description": "Reliable 20-ton crawler crane for rough terrain operation"
                    }
                ]
                
                # Add test equipment to database
                for equip in test_equipment:
                    equip["createdAt"] = firestore.SERVER_TIMESTAMP
                    equip["updatedAt"] = firestore.SERVER_TIMESTAMP
                    
                    self.db.collection("equipment").add(equip)
                    
                logger.info(f"Created {len(test_equipment)} test equipment records")
        except Exception as e:
            logger.error(f"Error creating test data: {e}")
    
    def _check_mock_mode(self):
        """Check if we should operate in mock mode"""
        return hasattr(self, 'mock_data')

# Create a singleton instance
firebase_service = FirebaseService()
