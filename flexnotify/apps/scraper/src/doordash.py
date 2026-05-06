"""
DoorDash Dasher Scraper
Monitors DoorDash Dasher app for available delivery orders.
Uses the DoorDash Dasher web portal and intercepts API calls.
"""

import time
from typing import List, Dict, Any
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
from playwright.sync_api import sync_playwright, Page, Browser
import requests


class DoorDashScraper:
    DASHER_API = "https://api.doordash.com/v2"
    LOGIN_URL = "https://www.doordash.com/dasher/login"

    def __init__(self, email: str, password: str, headless: bool = True):
        self.email = email
        self.password = password
        self.headless = headless
        self.playwright = None
        self.browser: Browser = None
        self.page: Page = None
        self.session_cookies = {}
        self.jwt_token = None
        self.seen_ids = set()

    def login(self):
        """Login to DoorDash Dasher portal"""
        logger.info("DoorDash: Starting login...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )

        context = self.browser.new_context(
            user_agent="DoorDash/5.162.0 (com.doordash.driverapp; build:5; iOS 16.6.0)",
            viewport={"width": 390, "height": 844},
        )
        self.page = context.new_page()
        self.page.on("request", self._intercept_request)
        self.page.on("response", self._intercept_response)

        try:
            self.page.goto(self.LOGIN_URL, timeout=30000)
            self.page.wait_for_selector("[data-testid='email-input']", timeout=15000)
            self.page.fill("[data-testid='email-input']", self.email)
            self.page.fill("[data-testid='password-input']", self.password)
            self.page.click("[data-testid='submit-button']")
            self.page.wait_for_timeout(4000)
            logger.info("DoorDash: Login successful")
        except Exception as e:
            logger.error(f"DoorDash login error: {e}")
            # Continue — some regions use different selectors
            try:
                # Fallback selectors
                self.page.fill("input[type='email']", self.email)
                self.page.fill("input[type='password']", self.password)
                self.page.click("button[type='submit']")
                self.page.wait_for_timeout(4000)
            except Exception as e2:
                logger.error(f"DoorDash fallback login error: {e2}")

    def _intercept_request(self, request):
        """Capture auth tokens"""
        if "doordash.com/api" in request.url or "api.doordash.com" in request.url:
            auth = request.headers.get("authorization", "")
            if auth and "Bearer" in auth:
                self.jwt_token = auth.replace("Bearer ", "")

    def _intercept_response(self, response):
        """Capture session cookies from responses"""
        if "doordash.com" in response.url and response.status == 200:
            pass  # Playwright handles cookies automatically via context

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get_available_orders(self) -> List[Dict[str, Any]]:
        """Fetch available DoorDash delivery offers"""
        if not self.jwt_token:
            logger.warning("DoorDash: No JWT token, re-logging in")
            self.login()
            return []

        headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json",
            "X-Client-Source": "doordash-dasher-web",
        }

        try:
            # Get nearby available orders
            response = requests.get(
                f"{self.DASHER_API}/dasher/dasher_onboarding/available_orders",
                headers=headers,
                timeout=10,
            )

            if response.status_code == 401:
                logger.warning("DoorDash: Token expired, re-logging in")
                self.login()
                return []

            if response.status_code != 200:
                logger.error(f"DoorDash API error: {response.status_code} {response.text[:200]}")
                return []

            data = response.json()
            orders = []

            for offer in data.get("orders", data.get("delivery_offers", [])):
                order_id = str(offer.get("id", offer.get("delivery_id", "")))
                if not order_id or order_id in self.seen_ids:
                    continue

                price = float(offer.get("total_pay", {}).get("unit_amount", 0)) / 100
                zone = offer.get("zone_name", offer.get("area_name", "Unknown"))
                restaurant = offer.get("restaurant_name", offer.get("store_name", "Restaurant"))
                distance = offer.get("delivery_distance", {}).get("value", 0)
                duration = offer.get("estimated_delivery_duration", 0)

                order = {
                    "platform": "doordash",
                    "external_id": order_id,
                    "title": f"DoorDash Order - {restaurant}",
                    "description": f"From {restaurant}",
                    "pickup_location": offer.get("pickup_address", {}).get("formatted_address", zone),
                    "delivery_zone": zone,
                    "price": price,
                    "currency": "USD",
                    "distance_km": float(distance) * 1.609 if distance else None,
                    "estimated_duration_min": int(duration) if duration else None,
                    "raw_data": offer,
                }
                orders.append(order)
                self.seen_ids.add(order_id)

            return orders

        except Exception as e:
            logger.error(f"DoorDash get_orders error: {e}")
            return []

    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
