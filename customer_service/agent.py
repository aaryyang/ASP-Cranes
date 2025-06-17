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
"""Agent module for the customer service agent."""

import logging
import warnings
import os

from google.adk import Agent
from .config import Config
from .prompts import GLOBAL_INSTRUCTION, INSTRUCTION
from .shared_libraries.callbacks import (rate_limit_callback, before_agent, before_tool, after_tool)
from .tools.tools import (
    capture_lead_information,
    check_equipment_availability,
    schedule_equipment_rental,
    get_equipment_schedule,
    calculate_equipment_pricing,
    generate_project_quote
)
from .integrations.crm_sync import crm_sync

warnings.filterwarnings("ignore", category=UserWarning, module=".*pydantic.*")

# Load config
configs = Config()

# Setup logger
logger = logging.getLogger(__name__)

# ===================== ADDED BLOCK FOR CREDENTIALS ===================== #
# If not running inside GCP, load credentials from JSON and configure manually
if not os.environ.get("GOOGLE_CLOUD_PROJECT"):
    from google.auth import load_credentials_from_file
    from google.generativeai import configure as configure_genai

    creds_path = configs.APPLICATION_CREDENTIALS or "service-account.json"
    credentials, project_id = load_credentials_from_file(
        creds_path, scopes=["https://www.googleapis.com/auth/cloud-platform"])
    configure_genai(credentials=credentials)
    logger.info(
        f"Using local service account: {creds_path} for project: {project_id}")
# ======================================================================= #

# Create the root agent
root_agent = Agent(
    model=configs.agent_settings.model,
    global_instruction=GLOBAL_INSTRUCTION,
    instruction=INSTRUCTION,
    name=configs.agent_settings.name,
    tools=[
        capture_lead_information,
        check_equipment_availability,
        schedule_equipment_rental,
        get_equipment_schedule,
        calculate_equipment_pricing,
        generate_project_quote,
    ],
    before_tool_callback=before_tool,
    after_tool_callback=after_tool,
    before_agent_callback=before_agent,
    before_model_callback=rate_limit_callback,
)