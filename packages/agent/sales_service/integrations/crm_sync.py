
import requests
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sales_service.config import Config

logger = logging.getLogger(__name__)
config = Config()

class CRMSync:
    """Handles synchronization with external CRM systems"""
    
    def __init__(self):
        self.crm_url = config.CRM_WEBHOOK_URL
        self.api_key = config.CRM_API_KEY
        self.enabled = config.ENABLE_CRM_SYNC
    
    def sync_lead(self, lead_data: Dict[str, Any]) -> bool:
        """Sync captured lead data to CRM system"""
        if not self.enabled:
            logger.info("CRM sync disabled")
            return True
            
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Transform lead data for your CRM format
            crm_payload = self._transform_lead_data(lead_data)
            
            # Add timestamp and source metadata
            crm_payload["source_metadata"] = {
                "system": "ADK_Agent",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0"
            }
            
            response = requests.post(
                f"{self.crm_url}{config.CRM_LEAD_ENDPOINT}",
                json=crm_payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Lead synced successfully: {lead_data.get('customer_name')}")
                # Log the lead to a local file as backup
                self._log_lead_locally(lead_data)
                return True
            else:
                logger.error(f"CRM sync failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error syncing lead to CRM: {e}")
            return False
    
    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve customer data from CRM"""
        if not self.enabled:
            logger.info("CRM sync disabled")
            return None
            
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.crm_url}/api/customers/{customer_id}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Customer data retrieved successfully: {customer_id}")
                return response.json()
            else:
                logger.error(f"CRM customer retrieval failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving customer from CRM: {e}")
            return None
    
    def update_customer_status(self, customer_id: str, status: str, notes: Optional[str] = None) -> bool:
        """Update customer status in CRM"""
        if not self.enabled:
            logger.info("CRM sync disabled")
            return True
            
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'status': status,
                'updated_at': datetime.now().isoformat()
            }
            
            if notes:
                payload['notes'] = notes
                
            response = requests.patch(
                f"{self.crm_url}/api/customers/{customer_id}",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Customer status updated successfully: {customer_id}")
                return True
            else:
                logger.error(f"CRM status update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating customer status in CRM: {e}")
            return False
    
    def _transform_lead_data(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform agent lead data to CRM format"""
        return {
            'contact_name': lead_data.get('customer_name'),
            'company': lead_data.get('company_name'),
            'email': lead_data.get('email'),
            'phone': lead_data.get('phone'),
            'project_type': lead_data.get('project_type', 'Equipment Rental'),
            'timeline': lead_data.get('timeline'),
            'budget_range': lead_data.get('budget_range', 'Not specified'),
            'location': lead_data.get('location'),
            'equipment_needed': lead_data.get('equipment_types'),
            'project_description': lead_data.get('project_description'),
            'priority': lead_data.get('priority', 'normal'),
            'source': 'ASP_Cranes_AI_Agent',
            'status': 'new_lead'
        }
        
    def _log_lead_locally(self, lead_data: Dict[str, Any]) -> None:
        """Log lead data locally as backup"""
        try:
            import os
            log_dir = "crm_logs"
            os.makedirs(log_dir, exist_ok=True)
            
            filename = f"{log_dir}/lead_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(lead_data, f, indent=2)
                
            logger.info(f"Lead logged locally to {filename}")
        except Exception as e:
            logger.error(f"Failed to log lead locally: {e}")

# Global instance
crm_sync = CRMSync()
