"""
Database models for ASP Cranes Agent.
This is a placeholder module for future database integration.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


@dataclass
class BaseModel:
    """Base model for all database models."""
    id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            'id': self.id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModel':
        """Create model from dictionary."""
        return cls(
            id=data.get('id'),
            created_at=data.get('created_at', datetime.now()),
            updated_at=data.get('updated_at', datetime.now()),
        )


@dataclass
class Customer(BaseModel):
    """Customer model."""
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    company: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert customer to dictionary."""
        data = super().to_dict()
        data.update({
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'address': self.address,
            'notes': self.notes,
        })
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Customer':
        """Create customer from dictionary."""
        customer = super().from_dict(data)
        customer.first_name = data.get('first_name', '')
        customer.last_name = data.get('last_name', '')
        customer.email = data.get('email', '')
        customer.phone = data.get('phone', '')
        customer.company = data.get('company')
        customer.address = data.get('address')
        customer.notes = data.get('notes')
        return customer


@dataclass
class Lead(BaseModel):
    """Lead model."""
    full_name: str = ""
    phone_number: str = ""
    email_address: str = ""
    machinery_type: str = ""
    site_location: str = ""
    start_date: str = ""
    rental_days: int = 0
    shift_timing: str = ""
    company_name: Optional[str] = None
    designation: Optional[str] = None
    additional_notes: Optional[str] = None
    status: str = "new"  # new, contacted, qualified, converted, lost
    assigned_to: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert lead to dictionary."""
        data = super().to_dict()
        data.update({
            'full_name': self.full_name,
            'phone_number': self.phone_number,
            'email_address': self.email_address,
            'machinery_type': self.machinery_type,
            'site_location': self.site_location,
            'start_date': self.start_date,
            'rental_days': self.rental_days,
            'shift_timing': self.shift_timing,
            'company_name': self.company_name,
            'designation': self.designation,
            'additional_notes': self.additional_notes,
            'status': self.status,
            'assigned_to': self.assigned_to,
        })
        return data


@dataclass
class Equipment(BaseModel):
    """Equipment model."""
    name: str = ""
    equipment_type: str = ""
    model: str = ""
    capacity: str = ""
    available: bool = True
    hourly_rate: float = 0.0
    daily_rate: float = 0.0
    weekly_rate: float = 0.0
    monthly_rate: float = 0.0
    location: str = ""
    specifications: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert equipment to dictionary."""
        data = super().to_dict()
        data.update({
            'name': self.name,
            'equipment_type': self.equipment_type,
            'model': self.model,
            'capacity': self.capacity,
            'available': self.available,
            'hourly_rate': self.hourly_rate,
            'daily_rate': self.daily_rate,
            'weekly_rate': self.weekly_rate,
            'monthly_rate': self.monthly_rate,
            'location': self.location,
            'specifications': self.specifications,
        })
        return data


@dataclass
class Rental(BaseModel):
    """Rental model."""
    customer_id: str = ""
    equipment_id: str = ""
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    site_location: str = ""
    status: str = "scheduled"  # scheduled, active, completed, cancelled
    shift_timing: str = "Day Shift"
    operator_required: bool = False
    special_requirements: Optional[str] = None
    total_price: float = 0.0
    deposit_paid: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert rental to dictionary."""
        data = super().to_dict()
        data.update({
            'customer_id': self.customer_id,
            'equipment_id': self.equipment_id,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'site_location': self.site_location,
            'status': self.status,
            'shift_timing': self.shift_timing,
            'operator_required': self.operator_required,
            'special_requirements': self.special_requirements,
            'total_price': self.total_price,
            'deposit_paid': self.deposit_paid,
        })
        return data
