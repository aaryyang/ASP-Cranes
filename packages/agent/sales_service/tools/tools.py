# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Lead generation tool for the heavy equipment lifting customer service agent."""

import logging
import uuid
from datetime import datetime
from sales_service.integrations.crm_sync import crm_sync
# Import database service for CRM access (supports Firebase and PostgreSQL)
from sales_service.integrations.database_service import DatabaseServiceFactory

# Get database service instance (defaults to Firebase)
db_service = DatabaseServiceFactory.get_default_service()

logger = logging.getLogger(__name__)


def capture_lead_information(
        full_name: str,
        phone_number: str,
        email_address: str,
        machinery_type: str,
        site_location: str,
        start_date: str,  # format: 'YYYY-MM-DD'
        rental_days: int,
        shift_timing: str,
        company_name: str = "",
        designation: str = "",
        additional_notes: str = "") -> dict:
    """
    Captures lead details for heavy machinery rental based on user input.

    Args:
        full_name (str): Full name of the contact person.
        phone_number (str): Contact phone number.
        email_address (str): Contact email address.
        machinery_type (str): Type of machinery needed.
        site_location (str): Address of the site.
        start_date (str): Rental start date in YYYY-MM-DD format.
        rental_days (int): Number of rental days.
        shift_timing (str): Shift timing (e.g., 'Day Shift', 'Night Shift').
        company_name (str, optional): Name of the company.
        designation (str, optional): Job designation of the contact.
        additional_notes (str, optional): Any extra comments or requests.

    Returns:
        dict: A dictionary containing lead ID, status, and summary details.
    """
    lead_id = f"lead_{uuid.uuid4().hex[:8]}"
    logger.info("Capturing lead: %s (%s)", full_name, phone_number)

    # Priority logic based on rental duration
    priority = "high" if rental_days > 5 else "normal"
    follow_up_time = "2 hours" if priority == "high" else "24 hours"
    
    # Prepare lead details
    lead_details = {
        "customer_name": full_name,
        "company_name": company_name,
        "designation": designation,
        "phone": phone_number,
        "email": email_address,
        "equipment_types": machinery_type,
        "location": site_location,
        "start_date": start_date,
        "rental_days": rental_days,
        "shift_timing": shift_timing,
        "project_description": additional_notes,
        "timeline": f"{rental_days} days starting {start_date}",
        "priority": priority
    }
    
    # Sync with CRM
    crm_sync_result = crm_sync.sync_lead(lead_details)
    crm_status = "CRM sync successful" if crm_sync_result else "CRM sync failed"
    
    return {
        "status": "success",
        "lead_id": lead_id,
        "priority": priority,
        "crm_sync": crm_sync_result,
        "message":
        f"Lead captured successfully. Sales team will follow up within {follow_up_time}. {crm_status}",
        "lead_details": {
            "full_name": full_name,
            "company_name": company_name,
            "designation": designation,
            "contact": {
                "phone_number": phone_number,
                "email_address": email_address
            },
            "machinery_type": machinery_type,
            "site_location": site_location,
            "start_date": start_date,
            "rental_days": rental_days,
            "shift_timing": shift_timing,
            "additional_notes": additional_notes
        }
    }


def _calculate_lead_score(project_type: str, timeline: str, budget: str,
                          equipment: str, urgency: str) -> int:
    """Calculate lead score based on project parameters."""
    score = 50  # Base score

    # Budget scoring
    if "25000+" in budget.lower():
        score += 30
    elif "10000" in budget.lower():
        score += 20
    elif "5000" in budget.lower():
        score += 10

    # Timeline scoring (sooner = higher score)
    if any(word in timeline.lower() for word in ["week", "asap", "immediate"]):
        score += 25
    elif "month" in timeline.lower():
        score += 15

    # Equipment complexity scoring
    if any(word in equipment.lower()
           for word in ["tower", "100-ton", "specialized"]):
        score += 20
    elif any(word in equipment.lower() for word in ["50-ton", "mobile"]):
        score += 15
    elif "25-ton" in equipment.lower():
        score += 10

    # Urgency scoring
    urgency_scores = {"emergency": 25, "high": 20, "medium": 10, "low": 5}
    score += urgency_scores.get(urgency.lower(), 10)

    return min(score, 100)  # Cap at 100


def _determine_priority(lead_score: int, urgency: str) -> tuple:
    """Determine lead priority and follow-up timeline."""
    if lead_score >= 80 or urgency.lower() == "emergency":
        return "high", "2 hours"
    elif lead_score >= 60 or urgency.lower() == "high":
        return "medium", "4 hours"
    else:
        return "normal", "24 hours"


def check_equipment_availability(
        equipment_type: str,
        start_date: str,  # format: 'YYYY-MM-DD'
        end_date: str,    # format: 'YYYY-MM-DD'
        location: str = "") -> dict:
    """
    Check availability of specific equipment types for given date range.

    Args:
        equipment_type (str): Type of equipment (e.g., 'mobile crane', 'tower crane', 'boom lift').
        start_date (str): Start date in YYYY-MM-DD format.
        end_date (str): End date in YYYY-MM-DD format.
        location (str, optional): Preferred location or region.

    Returns:
        dict: Equipment availability status with available units and alternatives.
    """
    logger.info("Checking availability for %s from %s to %s", equipment_type, start_date, end_date)
    
    # Get real equipment data from database instead of mock data
    try:
        real_equipment = db_service.get_available_equipment()
        available_equipment = []
        
        # Filter equipment based on request
        equipment_type_lower = equipment_type.lower()
        for equipment in real_equipment:
            # Check if this equipment matches the requested type
            eq_name = equipment.get('equipment_name', '').lower()
            eq_type = equipment.get('equipment_type', '').lower()
            
            if (equipment_type_lower in eq_name or 
                equipment_type_lower in eq_type or
                any(word in eq_name for word in equipment_type_lower.split()) or
                any(word in eq_type for word in equipment_type_lower.split())):
                
                available_equipment.append({
                    "equipment_id": equipment.get('equipment_id', ''),
                    "equipment_name": equipment.get('equipment_name', ''),
                    "equipment_type": equipment.get('equipment_type', ''),
                    "max_capacity": equipment.get('max_capacity', ''),
                    "daily_rate": equipment.get('daily_rate', 0),
                    "status": equipment.get('status', 'Available')
                })
        
        return {
            "status": "success",
            "requested_equipment": equipment_type,
            "date_range": f"{start_date} to {end_date}",
            "location": location,
            "available_equipment": available_equipment,
            "total_options": len(available_equipment)
        }
        
    except Exception as e:
        logger.error(f"Error checking equipment availability: {e}")
        # Fallback to mock data if database fails
        return {
            "status": "error",
            "message": "Unable to check real equipment availability",
            "requested_equipment": equipment_type,
            "date_range": f"{start_date} to {end_date}",
            "available_equipment": [],
            "total_options": 0
        }


def schedule_equipment_rental(
        customer_name: str,
        phone_number: str,
        email: str,
        equipment_type: str,
        start_date: str,
        end_date: str,
        site_location: str,
        shift_timing: str = "Day Shift",
        operator_required: bool = False,
        special_requirements: str = "") -> dict:
    """
    Schedule equipment rental and create booking confirmation.

    Args:
        customer_name (str): Name of the customer.
        phone_number (str): Customer contact number.
        email (str): Customer email address.
        equipment_type (str): Type of equipment being scheduled.
        start_date (str): Rental start date in YYYY-MM-DD format.
        end_date (str): Rental end date in YYYY-MM-DD format.
        site_location (str): Job site address.
        shift_timing (str): Shift preference (Day Shift, Night Shift, 24/7).
        operator_required (bool): Whether certified operator is needed.
        special_requirements (str): Any special setup or transport requirements.

    Returns:
        dict: Booking confirmation with rental details and next steps.
    """
    booking_id = f"RENT_{uuid.uuid4().hex[:8].upper()}"
    logger.info("Scheduling equipment rental: %s for %s", equipment_type, customer_name)
    
    # Calculate rental duration
    from datetime import datetime
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    rental_days = (end - start).days + 1
    
    # Determine if pre-site visit is needed
    needs_site_visit = any(keyword in equipment_type.lower() 
                          for keyword in ["tower", "100-ton", "specialized", "heavy"])
    
    return {
        "status": "confirmed",
        "booking_id": booking_id,
        "customer_details": {
            "name": customer_name,
            "phone": phone_number,
            "email": email
        },
        "rental_details": {
            "equipment_type": equipment_type,
            "start_date": start_date,
            "end_date": end_date,
            "rental_days": rental_days,
            "site_location": site_location,
            "shift_timing": shift_timing,
            "operator_required": operator_required,
            "special_requirements": special_requirements
        },
        "next_steps": {
            "site_visit_required": needs_site_visit,
            "documentation_needed": ["Insurance certificate", "Site access permits"],
            "delivery_time": "24-48 hours advance notice required",
            "payment_terms": "50% deposit required to confirm booking"
        },
        "confirmation_message": f"Equipment rental scheduled successfully. Booking ID: {booking_id}. You will receive a detailed contract and payment instructions via email within 2 hours."
    }


def get_equipment_schedule(
        equipment_type: str = "",
        date_range: str = "7",  # days from today
        location: str = "") -> dict:
    """
    Get current equipment schedule and upcoming bookings.

    Args:
        equipment_type (str, optional): Filter by specific equipment type.
        date_range (str): Number of days to look ahead (default: 7).
        location (str, optional): Filter by location.

    Returns:
        dict: Current schedule with equipment availability timeline.
    """
    logger.info("Retrieving equipment schedule for %s days", date_range)
    
    # Mock schedule data - in real implementation, this would query booking system
    from datetime import datetime, timedelta
    
    today = datetime.now()
    schedule_data = []
    
    for i in range(int(date_range)):
        date = today + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        
        # Mock bookings for demonstration
        if i % 3 == 0:  # Some days have bookings
            schedule_data.append({
                "date": date_str,
                "day_of_week": date.strftime("%A"),
                "bookings": [
                    {
                        "booking_id": f"RENT_{uuid.uuid4().hex[:6].upper()}",
                        "equipment": "50-ton Mobile Crane",
                        "customer": "Construction Co.",
                        "location": "Downtown Project Site",
                        "shift": "Day Shift (8AM-5PM)",
                        "status": "confirmed"
                    }
                ]
            })
        else:
            schedule_data.append({
                "date": date_str,
                "day_of_week": date.strftime("%A"),
                "bookings": []
            })
    
    return {
        "status": "success",
        "date_range": f"{today.strftime('%Y-%m-%d')} to {(today + timedelta(days=int(date_range)-1)).strftime('%Y-%m-%d')}",
        "filter_equipment": equipment_type,
        "filter_location": location,
        "schedule": schedule_data,
        "summary": {
            "total_days": len(schedule_data),
            "days_with_bookings": len([d for d in schedule_data if d["bookings"]]),
            "available_days": len([d for d in schedule_data if not d["bookings"]])
        }
    }


def calculate_equipment_pricing(
        equipment_type: str,
        rental_duration: int,  # in days
        shift_type: str = "Day Shift",  # Day Shift, Night Shift, 24/7
        operator_required: bool = False,
        delivery_distance: float = 0.0,  # in miles
        special_requirements: str = "",
        project_complexity: str = "standard") -> dict:
    """
    Calculate real-time pricing for equipment rental with all associated costs.

    Args:
        equipment_type (str): Type of equipment (e.g., 'mobile crane 50-ton', 'tower crane').
        rental_duration (int): Number of rental days.
        shift_type (str): Shift preference (Day Shift, Night Shift, 24/7).
        operator_required (bool): Whether certified operator is needed.
        delivery_distance (float): Distance from depot to site in miles.
        special_requirements (str): Any special setup requirements.
        project_complexity (str): Project complexity level (standard, complex, specialized).

    Returns:
        dict: Comprehensive pricing breakdown with all costs and totals.
    """
    logger.info("Calculating pricing for %s, %d days", equipment_type, rental_duration)
    
    # Base pricing structure (in Indian Rupees - Lakhs)
    base_rates = {
        "mobile crane": {
            "25-ton": {"daily_rate": 120000, "hourly_rate": 15000, "operator_daily": 8000},  # ₹1.2L/day
            "50-ton": {"daily_rate": 200000, "hourly_rate": 25000, "operator_daily": 10000}, # ₹2L/day
            "100-ton": {"daily_rate": 350000, "hourly_rate": 44000, "operator_daily": 12000}, # ₹3.5L/day
            "130-ton": {"daily_rate": 450000, "hourly_rate": 56000, "operator_daily": 15000}, # ₹4.5L/day
            "150-ton": {"daily_rate": 550000, "hourly_rate": 69000, "operator_daily": 18000}  # ₹5.5L/day
        },
        "tower crane": {
            "standard": {"daily_rate": 300000, "hourly_rate": 38000, "operator_daily": 12000}, # ₹3L/day
            "heavy-duty": {"daily_rate": 450000, "hourly_rate": 56000, "operator_daily": 15000} # ₹4.5L/day
        },
        "boom lift": {
            "40ft": {"daily_rate": 80000, "hourly_rate": 10000, "operator_daily": 6000},   # ₹80K/day
            "60ft": {"daily_rate": 120000, "hourly_rate": 15000, "operator_daily": 7000},  # ₹1.2L/day
            "80ft": {"daily_rate": 180000, "hourly_rate": 23000, "operator_daily": 8000}   # ₹1.8L/day
        },
        "rough terrain crane": {
            "30-ton": {"daily_rate": 150000, "hourly_rate": 19000, "operator_daily": 9000}, # ₹1.5L/day
            "40-ton": {"daily_rate": 180000, "hourly_rate": 23000, "operator_daily": 10000} # ₹1.8L/day
        }
    }
    
    # Find matching equipment
    equipment_match = None
    base_daily_rate = 0
    operator_daily_rate = 0
    
    equipment_lower = equipment_type.lower()
    for eq_category, variants in base_rates.items():
        if eq_category in equipment_lower:
            for variant, rates in variants.items():
                if variant in equipment_lower or any(word in equipment_lower for word in variant.split('-')):
                    equipment_match = f"{eq_category} ({variant})"
                    base_daily_rate = rates["daily_rate"]
                    operator_daily_rate = rates["operator_daily"]
                    break
            if equipment_match:
                break
    
    if not equipment_match:
        # Default pricing for unmatched equipment (in Rupees)
        base_daily_rate = 120000
        operator_daily_rate = 6500
        equipment_match = equipment_type
    
    # Calculate base equipment cost
    equipment_subtotal = base_daily_rate * rental_duration
    
    # Shift multipliers
    shift_multipliers = {
        "day shift": 1.0,
        "night shift": 1.3,
        "24/7": 1.5
    }
    shift_multiplier = shift_multipliers.get(shift_type.lower(), 1.0)
    equipment_total = equipment_subtotal * shift_multiplier
    
    # Operator costs
    operator_total = 0
    if operator_required:
        operator_subtotal = operator_daily_rate * rental_duration
        operator_total = operator_subtotal * shift_multiplier
    
    # Delivery and transport costs (in Rupees)
    delivery_cost = 0
    if delivery_distance > 0:
        delivery_cost = max(15000, delivery_distance * 350)  # ₹350 per km, minimum ₹15,000
        if delivery_distance > 160:  # 100 miles = ~160 km
            delivery_cost += 40000  # Long distance surcharge
    
    # Complexity multipliers
    complexity_multipliers = {
        "standard": 1.0,
        "complex": 1.15,
        "specialized": 1.3
    }
    complexity_multiplier = complexity_multipliers.get(project_complexity.lower(), 1.0)
    
    # Special requirements costs (in Rupees)
    special_costs = 0
    if special_requirements:
        special_keywords = {
            "night": 40000,
            "weekend": 25000,
            "crane pad": 65000,
            "rigging": 32000,
            "assembly": 50000,
            "disassembly": 32000,
            "permit": 20000
        }
        for keyword, cost in special_keywords.items():
            if keyword in special_requirements.lower():
                special_costs += cost
    
    # Volume discounts
    volume_discount = 0
    if rental_duration >= 30:
        volume_discount = equipment_total * 0.15  # 15% discount for 30+ days
    elif rental_duration >= 14:
        volume_discount = equipment_total * 0.10  # 10% discount for 14+ days
    elif rental_duration >= 7:
        volume_discount = equipment_total * 0.05   # 5% discount for 7+ days
    
    # Apply complexity multiplier to equipment and operator costs
    equipment_total *= complexity_multiplier
    operator_total *= complexity_multiplier
    
    # Calculate subtotal and tax (GST in India)
    subtotal = equipment_total + operator_total + delivery_cost + special_costs - volume_discount
    tax_rate = 0.18  # 18% GST
    tax_amount = subtotal * tax_rate
    total_cost = subtotal + tax_amount
    
    return {
        "status": "success",
        "equipment_match": equipment_match,
        "pricing_breakdown": {
            "equipment_costs": {
                "base_daily_rate": base_daily_rate,
                "rental_days": rental_duration,
                "shift_type": shift_type,
                "shift_multiplier": shift_multiplier,
                "complexity_multiplier": complexity_multiplier,
                "equipment_subtotal": round(equipment_subtotal, 2),
                "equipment_total": round(equipment_total, 2)
            },
            "operator_costs": {
                "operator_required": operator_required,
                "operator_daily_rate": operator_daily_rate if operator_required else 0,
                "operator_total": round(operator_total, 2)
            },
            "additional_costs": {
                "delivery_distance": delivery_distance,
                "delivery_cost": round(delivery_cost, 2),
                "special_requirements_cost": round(special_costs, 2)
            },
            "discounts": {
                "volume_discount_percentage": round((volume_discount / equipment_total * 100) if equipment_total > 0 else 0, 1),
                "volume_discount_amount": round(volume_discount, 2)
            }
        },
        "cost_summary": {
            "subtotal": round(subtotal, 2),
            "tax_rate": f"{tax_rate * 100}%",
            "tax_amount": round(tax_amount, 2),
            "total_cost": round(total_cost, 2),
            "daily_average": round(total_cost / rental_duration, 2)
        },
        "quote_validity": "Valid for 30 days",
        "payment_terms": "50% deposit required, balance due upon completion"
    }


def generate_project_quote(
        project_name: str,
        customer_name: str,
        equipment_list: list,  # List of equipment with durations
        project_start_date: str,
        project_duration: int,
        site_location: str,
        project_description: str = "",
        include_permits: bool = False,
        rush_order: bool = False) -> dict:
    """
    Generate comprehensive project quote with multiple equipment and services.

    Args:
        project_name (str): Name/title of the project.
        customer_name (str): Customer or company name.
        equipment_list (list): List of equipment with details [{"equipment_type": str, "duration": int, "operator": bool}].
        project_start_date (str): Project start date in YYYY-MM-DD format.
        project_duration (int): Total project duration in days.
        site_location (str): Project site address.
        project_description (str): Description of the project scope.
        include_permits (bool): Whether permit assistance is included.
        rush_order (bool): Whether this is a rush order (< 48 hours notice).

    Returns:
        dict: Complete project quote with itemized costs and terms.
    """
    quote_id = f"QUOTE_{uuid.uuid4().hex[:8].upper()}"
    logger.info("Generating project quote %s for %s", quote_id, customer_name)
    
    from datetime import datetime, timedelta
    
    # Calculate project dates
    start_date = datetime.strptime(project_start_date, "%Y-%m-%d")
    end_date = start_date + timedelta(days=project_duration - 1)
    
    # Process each equipment item
    equipment_quotes = []
    total_equipment_cost = 0
    
    for equipment in equipment_list:
        equipment_type = equipment.get("equipment_type", "")
        duration = equipment.get("duration", project_duration)
        operator_required = equipment.get("operator", False)
        
        # Calculate pricing for this equipment
        pricing = calculate_equipment_pricing(
            equipment_type=equipment_type,
            rental_duration=duration,
            operator_required=operator_required,
            project_complexity="standard"
        )
        
        equipment_quotes.append({
            "equipment_type": equipment_type,
            "duration": duration,
            "operator_included": operator_required,
            "cost": pricing["cost_summary"]["total_cost"]
        })
        
        total_equipment_cost += pricing["cost_summary"]["total_cost"]
    
    # Additional project costs
    project_management_fee = total_equipment_cost * 0.08  # 8% PM fee
    insurance_cost = total_equipment_cost * 0.03  # 3% insurance
    
    # Site preparation and logistics
    site_prep_cost = 0
    if project_duration > 7:
        site_prep_cost = 1500  # Site setup for longer projects
    
    # Permit assistance
    permit_cost = 0
    if include_permits:
        permit_cost = 2500
    
    # Rush order surcharge
    rush_surcharge = 0
    if rush_order:
        rush_surcharge = total_equipment_cost * 0.20  # 20% rush surcharge
    
    # Calculate totals
    subtotal = (total_equipment_cost + project_management_fee + 
                insurance_cost + site_prep_cost + permit_cost + rush_surcharge)
    
    tax_amount = subtotal * 0.08  # 8% tax
    grand_total = subtotal + tax_amount
    
    # Payment schedule
    deposit_amount = grand_total * 0.50  # 50% deposit
    balance_amount = grand_total - deposit_amount
    
    return {
        "status": "success",
        "quote_details": {
            "quote_id": quote_id,
            "project_name": project_name,
            "customer_name": customer_name,
            "quote_date": datetime.now().strftime("%Y-%m-%d"),
            "project_dates": {
                "start_date": project_start_date,
                "end_date": end_date.strftime("%Y-%m-%d"),
                "duration_days": project_duration
            },
            "site_location": site_location,
            "project_description": project_description
        },
        "equipment_breakdown": equipment_quotes,
        "cost_breakdown": {
            "equipment_total": round(total_equipment_cost, 2),
            "project_management_fee": round(project_management_fee, 2),
            "insurance_cost": round(insurance_cost, 2),
            "site_preparation": round(site_prep_cost, 2),
            "permit_assistance": round(permit_cost, 2),
            "rush_order_surcharge": round(rush_surcharge, 2),
            "subtotal": round(subtotal, 2),
            "tax_amount": round(tax_amount, 2),
            "grand_total": round(grand_total, 2)
        },
        "payment_schedule": {
            "deposit_required": round(deposit_amount, 2),
            "deposit_percentage": "50%",
            "balance_due": round(balance_amount, 2),
            "payment_terms": "Deposit due upon contract signing, balance due upon project completion"
        },
        "quote_terms": {
            "validity_period": "30 days",
            "warranty": "Equipment performance guaranteed",
            "cancellation_policy": "72-hour notice required for cancellation",
            "weather_policy": "Weather delays do not incur additional charges"
        },
        "next_steps": [
            "Review and approve quote",
            "Submit deposit payment",
            "Schedule pre-project site visit",
            "Finalize equipment delivery schedule",
            "Complete insurance and permit documentation"
        ]
    }


def get_user_info(user_id: str) -> dict:
    """
    Get user information from CRM for personalization.
    
    Args:
        user_id: The ID of the user to get information for
        
    Returns:
        Dictionary containing user info or error message
    """
    try:
        user_data = db_service.get_user_by_id(user_id)
        
        if not user_data:
            return {
                "success": False,
                "error": "User not found",
                "user_info": {
                    "name": "Customer",
                    "role": "unknown"
                }
            }
            
        # Return only needed user information for personalization
        return {
            "success": True,
            "user_info": {
                "id": user_id,
                "name": user_data.get("name", "Customer"),
                "email": user_data.get("email", ""),
                "role": user_data.get("role", "unknown")
            }
        }
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        return {
            "success": False,
            "error": str(e),
            "user_info": {
                "name": "Customer",
                "role": "unknown"
            }
        }

def get_available_equipment() -> dict:
    """
    Get a list of available equipment for scheduling.
    
    Returns:
        Dictionary containing equipment list or error message
    """
    try:
        equipment_list = db_service.get_available_equipment()
        
        return {
            "success": True,
            "count": len(equipment_list),
            "equipment": equipment_list
        }
    except Exception as e:
        logger.error(f"Error getting available equipment: {e}")
        return {
            "success": False,
            "error": str(e),
            "equipment": []
        }

def create_new_lead(
    customer_name: str,
    email: str,
    phone: str,
    service_needed: str,
    site_location: str,
    start_date: str,
    rental_days: int,
    shift_timing: str,
    company_name: str = "",
    designation: str = "",
    notes: str = ""
) -> dict:
    """
    Creates a new lead in the CRM system.
    
    Args:
        customer_name: Name of the customer
        email: Email address
        phone: Phone number
        service_needed: Type of service/equipment needed
        site_location: Location of the site
        start_date: Start date in YYYY-MM-DD format
        rental_days: Number of days for rental
        shift_timing: Shift timing (Day/Night/Both)
        company_name: Optional company name
        designation: Optional job title
        notes: Optional additional notes
        
    Returns:
        Dictionary containing success status and lead ID
    """
    try:
        # Create the lead object
        lead_data = {
            "customerName": customer_name,
            "email": email,
            "phone": phone,
            "serviceNeeded": service_needed,
            "siteLocation": site_location,
            "startDate": start_date,
            "rentalDays": rental_days,
            "shiftTiming": shift_timing,
            "status": "new",
            "assignedTo": "",  # Will be assigned by CRM admin or sales manager
            "companyName": company_name,
            "designation": designation,
            "notes": notes
        }
        
        # Add lead to CRM database
        lead_id = db_service.create_lead(lead_data)
        
        if not lead_id:
            return {
                "success": False,
                "error": "Failed to create lead in database"
            }
            
        return {
            "success": True,
            "lead_id": lead_id,
            "message": "Lead created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating lead: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def schedule_job(
    lead_id: str,
    customer_name: str,
    equipment_id: str,
    start_date: str,
    end_date: str,
    location: str,
    operator_id: str = "",
    notes: str = ""
) -> dict:
    """
    Schedules a job in the CRM system.
    
    Args:
        lead_id: ID of the associated lead
        customer_name: Name of the customer
        equipment_id: ID of the equipment to schedule
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        location: Job location
        operator_id: Optional operator ID
        notes: Optional additional notes
        
    Returns:
        Dictionary containing success status and job ID
    """
    try:
        # Create the job object
        job_data = {
            "leadId": lead_id,
            "customerName": customer_name,
            "equipmentId": equipment_id,
            "operatorId": operator_id,
            "status": "scheduled",
            "startDate": start_date,
            "endDate": end_date,
            "location": location,
            "notes": notes
        }
        
        # Add job to CRM database
        job_id = db_service.schedule_job(job_data)
        
        if not job_id:
            return {
                "success": False,
                "error": "Failed to schedule job in database"
            }
            
        return {
            "success": True,
            "job_id": job_id,
            "message": "Job scheduled successfully"
        }
        
    except Exception as e:
        logger.error(f"Error scheduling job: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def get_customer_info(customer_id: str = "", email: str = "") -> dict:
    """
    Get customer information from CRM database.
    
    Args:
        customer_id: Optional ID of the customer
        email: Optional email of the customer
        
    Returns:
        Dictionary containing customer info or error message
    """
    try:
        customer_data = None
        
        if customer_id:
            customer_data = db_service.get_customer_by_id(customer_id)
        elif email:
            # Get customers and filter by email
            customers = db_service.get_customers(limit=100)
            for customer in customers:
                if customer.get("email") == email:
                    customer_data = customer
                    break
        
        if not customer_data:
            return {
                "success": False,
                "error": "Customer not found",
                "customer_info": {}
            }
            
        return {
            "success": True,
            "customer_info": customer_data
        }
        
    except Exception as e:
        logger.error(f"Error getting customer info: {e}")
        return {
            "success": False,
            "error": str(e),
            "customer_info": {}
        }
