"""
FlexNotify API Client
Used by the scraper to send delivery data to the backend
"""

import requests
from typing import Dict, Any, Optional
from loguru import logger


class FlexNotifyAPI:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": api_key,
            "Content-Type": "application/json",
        })

    def ingest_delivery(self, delivery: Dict[str, Any]) -> Optional[Dict]:
        """Send a new delivery to the backend for storage and notification"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/deliveries/ingest",
                json=delivery,
                timeout=10,
            )

            if response.status_code in (200, 201):
                return response.json()
            elif response.status_code == 409:
                # Already exists — update status to available
                data = response.json()
                delivery_id = data.get("data", {}).get("id")
                if delivery_id:
                    self.update_delivery_status(delivery_id, "available")
                return data
            else:
                logger.warning(f"Ingest failed {response.status_code}: {response.text[:200]}")
                return None

        except requests.RequestException as e:
            logger.error(f"API ingest error: {e}")
            return None

    def update_delivery_status(self, delivery_id: str, status: str) -> bool:
        """Update the status of a delivery (available, taken, expired)"""
        try:
            response = self.session.patch(
                f"{self.base_url}/api/deliveries/{delivery_id}/status",
                json={"status": status},
                timeout=10,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Update status error: {e}")
            return False

    def trigger_availability_check(self) -> bool:
        """Trigger n8n to verify all active deliveries are still available"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/webhooks/trigger-check",
                json={"action": "verify_availability"},
                timeout=10,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Trigger check error: {e}")
            return False

    def health_check(self) -> bool:
        """Check if the API is reachable"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
