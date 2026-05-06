"""
Amazon Flex Scraper
Uses Playwright to monitor the Amazon Flex app/web for available delivery blocks.

NOTE: Amazon Flex primarily runs as a mobile app. This scraper interfaces with
the Amazon Flex web dashboard and uses the undocumented Flex API endpoints
that the mobile app communicates with.
"""

import json
import re
import time
from typing import List, Dict, Any
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
from playwright.sync_api import sync_playwright, Page, Browser


class AmazonFlexScraper:
    FLEX_API_BASE = "https://flex-capacity-na.amazon.com"
    LOGIN_URL = "https://amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Flogistics.amazon.com&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_logistics_de_desktop&openid.mode=checkid_setup&marketPlaceId=ATVPDKIKX0DER&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&"

    def __init__(self, email: str, password: str, headless: bool = True):
        self.email = email
        self.password = password
        self.headless = headless
        self.playwright = None
        self.browser: Browser = None
        self.page: Page = None
        self.auth_token = None
        self.seen_ids = set()

    def login(self):
        """Login to Amazon Flex and capture auth token"""
        logger.info("Amazon Flex: Starting login...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )

        context = self.browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            viewport={"width": 390, "height": 844},
        )
        self.page = context.new_page()

        # Intercept API calls to capture auth token
        self.page.on("request", self._intercept_request)

        try:
            self.page.goto(self.LOGIN_URL, timeout=30000)
            self.page.fill("#ap_email", self.email)
            self.page.click("#continue")
            self.page.wait_for_selector("#ap_password", timeout=10000)
            self.page.fill("#ap_password", self.password)
            self.page.click("#signInSubmit")
            self.page.wait_for_timeout(3000)
            logger.info("Amazon Flex: Login successful")
        except Exception as e:
            logger.error(f"Amazon Flex login error: {e}")
            raise

    def _intercept_request(self, request):
        """Capture auth tokens from API requests"""
        if "flex-capacity" in request.url:
            auth = request.headers.get("authorization", "")
            if auth and auth.startswith("Bearer "):
                self.auth_token = auth.replace("Bearer ", "")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get_available_blocks(self) -> List[Dict[str, Any]]:
        """Fetch available delivery blocks"""
        if not self.auth_token:
            logger.warning("Amazon Flex: No auth token, attempting re-login")
            self.login()
            return []

        import requests
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "x-flex-instance-id": "flex-web-client",
        }

        try:
            response = requests.get(
                f"{self.FLEX_API_BASE}/GetEligibleServiceAreas",
                headers=headers,
                timeout=10,
            )

            if response.status_code == 401:
                logger.warning("Amazon Flex: Token expired, re-logging in")
                self.login()
                return []

            if response.status_code != 200:
                logger.error(f"Amazon Flex API error: {response.status_code}")
                return []

            data = response.json()
            blocks = []

            for offer in data.get("serviceAreaList", []):
                block_id = offer.get("serviceAreaId", "")
                if block_id in self.seen_ids:
                    continue

                price = offer.get("rateInfo", {}).get("priceAmount", 0)
                zone = offer.get("serviceAreaName", "Unknown")
                start_time = offer.get("startTime", "")
                end_time = offer.get("endTime", "")
                duration_min = offer.get("durationMinutes", 0)

                block = {
                    "platform": "amazon_flex",
                    "external_id": block_id,
                    "title": f"Amazon Flex Block - {zone}",
                    "description": f"{start_time} - {end_time}",
                    "pickup_location": offer.get("stationCode", zone),
                    "delivery_zone": zone,
                    "price": float(price),
                    "currency": "USD",
                    "estimated_duration_min": int(duration_min),
                    "raw_data": offer,
                }
                blocks.append(block)
                self.seen_ids.add(block_id)

            return blocks

        except Exception as e:
            logger.error(f"Amazon Flex get_blocks error: {e}")
            return []

    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
