"""
Database abstraction layer for ASP Cranes Agent CRM integration.

This module provides an abstract interface for database operations that can be easily
switched between Firebase Firestore and PostgreSQL implementations.

Author: ASP Cranes Agent Team
Date: 2025
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseService(ABC):
    """Abstract base class for database service implementations"""
    
    @abstractmethod
    def initialize(self) -> None:
        """Initialize the database connection"""
        pass
    
    # User Management
    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their ID"""
        pass
    
    @abstractmethod
    def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Create a new user and return the user ID"""
        pass
    
    @abstractmethod
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Update an existing user"""
        pass
    
    # Customer Management
    @abstractmethod
    def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by their ID"""
        pass
    
    @abstractmethod
    def get_customers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of customers"""
        pass
    
    @abstractmethod
    def create_customer(self, customer_data: Dict[str, Any]) -> Optional[str]:
        """Create a new customer and return the customer ID"""
        pass
    
    @abstractmethod
    def update_customer(self, customer_id: str, customer_data: Dict[str, Any]) -> bool:
        """Update an existing customer"""
        pass
    
    # Lead Management
    @abstractmethod
    def get_leads(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of leads"""
        pass
    
    @abstractmethod
    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get a lead by its ID"""
        pass
    
    @abstractmethod
    def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """Create a new lead and return the lead ID"""
        pass
    
    @abstractmethod
    def update_lead(self, lead_id: str, lead_data: Dict[str, Any]) -> bool:
        """Update an existing lead"""
        pass
    
    @abstractmethod
    def get_leads_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all leads for a specific customer"""
        pass
    
    # Equipment Management
    @abstractmethod
    def get_equipment(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get a list of equipment, optionally filtered by status"""
        pass
    
    @abstractmethod
    def get_available_equipment(self) -> List[Dict[str, Any]]:
        """Get a list of available equipment"""
        pass
    
    @abstractmethod
    def get_equipment_by_id(self, equipment_id: str) -> Optional[Dict[str, Any]]:
        """Get equipment by its ID"""
        pass
    
    @abstractmethod
    def update_equipment_status(self, equipment_id: str, status: str) -> bool:
        """Update equipment status"""
        pass
    
    # Job Management
    @abstractmethod
    def get_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of jobs"""
        pass
    
    @abstractmethod
    def get_job_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job by its ID"""
        pass
    
    @abstractmethod
    def schedule_job(self, job_data: Dict[str, Any]) -> Optional[str]:
        """Schedule a new job and return the job ID"""
        pass
    
    @abstractmethod
    def update_job(self, job_id: str, job_data: Dict[str, Any]) -> bool:
        """Update an existing job"""
        pass
    
    @abstractmethod
    def get_jobs_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get all jobs for a specific customer"""
        pass
    
    @abstractmethod
    def get_jobs_by_equipment(self, equipment_id: str) -> List[Dict[str, Any]]:
        """Get all jobs for specific equipment"""
        pass
    
    # Quotation Management
    @abstractmethod
    def get_quotations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get a list of quotations"""
        pass
    
    @abstractmethod
    def get_quotation_by_id(self, quotation_id: str) -> Optional[Dict[str, Any]]:
        """Get a quotation by its ID"""
        pass
    
    @abstractmethod
    def create_quotation(self, quotation_data: Dict[str, Any]) -> Optional[str]:
        """Create a new quotation and return the quotation ID"""
        pass
    
    @abstractmethod
    def update_quotation(self, quotation_id: str, quotation_data: Dict[str, Any]) -> bool:
        """Update an existing quotation"""
        pass
    
    # Chat History Management (for AI assistant)
    @abstractmethod
    def save_chat_message(self, user_id: str, message: Dict[str, Any]) -> Optional[str]:
        """Save a chat message and return the message ID"""
        pass
    
    @abstractmethod
    def get_chat_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a user"""
        pass
    
    @abstractmethod
    def clear_chat_history(self, user_id: str) -> bool:
        """Clear chat history for a user"""
        pass
    
    # Utility Methods
    @abstractmethod
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics for debugging"""
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if the database connection is healthy"""
        pass


class DatabaseServiceFactory:
    """Factory class to create database service instances"""
    
    _instance = None
    
    @classmethod
    def get_service(cls, service_type: str = "firebase") -> DatabaseService:
        """
        Get a database service instance
        
        Args:
            service_type: Type of database service ('firebase' or 'postgresql')
            
        Returns:
            DatabaseService instance
        """
        if service_type.lower() == "firebase":
            from .firebase_database_service import FirebaseDatabaseService
            return FirebaseDatabaseService()
        elif service_type.lower() == "postgresql":
            from .postgresql_database_service import PostgreSQLDatabaseService
            return PostgreSQLDatabaseService()
        else:
            raise ValueError(f"Unsupported database service type: {service_type}")
    
    @classmethod
    def get_default_service(cls) -> DatabaseService:
        """Get the default database service based on environment configuration"""
        database_type = os.environ.get('DATABASE_TYPE', 'firebase').lower()
        return cls.get_service(database_type)
