# Copyright 2025 Google LLC

import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, Field

from dotenv import load_dotenv
from google.auth import default as google_auth_default

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))


class AgentModel(BaseModel):
    """Agent model settings."""

    name: str = Field(default="customer_service_agent")
    model: str = Field(default="gemini-2.0-flash-001")


class Config(BaseSettings):
    """Configuration settings for the customer service agent."""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              "../.env"),
        env_prefix="GOOGLE_",
        case_sensitive=True,
    )

    agent_settings: AgentModel = Field(default=AgentModel())
    app_name: str = "customer_service_app"
    GOOGLE_CLOUD_PROJECT: str = Field(default="my_project")
    GOOGLE_CLOUD_LOCATION: str = Field(default="us-central1")
    GENAI_USE_VERTEXAI: str = Field(default="1")
    API_KEY: str | None = Field(default="")
    APPLICATION_CREDENTIALS: str = Field(default="service-account.json")
    
    # CRM Integration Settings
    CRM_WEBHOOK_URL: str = Field(default="")
    CRM_API_KEY: str = Field(default="")
    CRM_LEAD_ENDPOINT: str = Field(default="/api/leads")
    ENABLE_CRM_SYNC: bool = Field(default=True)


# Initialize config
config = Config()

# Assert service account exists
if not os.path.exists(config.APPLICATION_CREDENTIALS):
    raise FileNotFoundError(
        f"Service account not found at {config.APPLICATION_CREDENTIALS}")

# Load Google credentials
credentials, project_id = google_auth_default()

# Optional: log loaded project
logger.info(f"Loaded GCP credentials for project: {project_id}")
