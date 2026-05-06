"""
FlexNotify Scraper — Main Orchestrator
Runs 24/7 monitoring Amazon Flex and DoorDash for new delivery blocks
"""

import os
import time
import schedule
import threading
from dotenv import load_dotenv
from loguru import logger
from amazon_flex import AmazonFlexScraper
from doordash import DoorDashScraper
from api_client import FlexNotifyAPI

load_dotenv()

logger.add(
    "logs/scraper_{time}.log",
    rotation="100 MB",
    retention="7 days",
    level=os.getenv("LOG_LEVEL", "INFO"),
)

API = FlexNotifyAPI(
    base_url=os.getenv("FLEXNOTIFY_API_URL", "http://localhost:3001"),
    api_key=os.getenv("SCRAPER_API_KEY", ""),
)

amazon_scraper = None
doordash_scraper = None


def init_scrapers():
    global amazon_scraper, doordash_scraper
    logger.info("Initializing scrapers...")

    amazon_scraper = AmazonFlexScraper(
        email=os.getenv("AMAZON_FLEX_EMAIL", ""),
        password=os.getenv("AMAZON_FLEX_PASSWORD", ""),
        headless=os.getenv("HEADLESS", "true").lower() == "true",
    )

    doordash_scraper = DoorDashScraper(
        email=os.getenv("DOORDASH_EMAIL", ""),
        password=os.getenv("DOORDASH_PASSWORD", ""),
        headless=os.getenv("HEADLESS", "true").lower() == "true",
    )

    amazon_scraper.login()
    doordash_scraper.login()
    logger.info("Scrapers initialized and logged in")


def scrape_amazon():
    """Poll Amazon Flex for available delivery blocks"""
    if not amazon_scraper:
        return
    try:
        blocks = amazon_scraper.get_available_blocks()
        logger.info(f"Amazon Flex: found {len(blocks)} blocks")
        for block in blocks:
            result = API.ingest_delivery(block)
            if result:
                logger.debug(f"Ingested Amazon block: {block['external_id']} ${block['price']}")
    except Exception as e:
        logger.error(f"Amazon Flex scrape error: {e}")


def scrape_doordash():
    """Poll DoorDash for available delivery orders"""
    if not doordash_scraper:
        return
    try:
        orders = doordash_scraper.get_available_orders()
        logger.info(f"DoorDash: found {len(orders)} orders")
        for order in orders:
            result = API.ingest_delivery(order)
            if result:
                logger.debug(f"Ingested DoorDash order: {order['external_id']} ${order['price']}")
    except Exception as e:
        logger.error(f"DoorDash scrape error: {e}")


def verify_delivery_availability():
    """Check if previously seen deliveries are still available"""
    try:
        # This triggers n8n to re-verify deliveries status
        API.trigger_availability_check()
    except Exception as e:
        logger.error(f"Availability check error: {e}")


def run_threaded(job_func):
    job_thread = threading.Thread(target=job_func)
    job_thread.daemon = True
    job_thread.start()


def main():
    logger.info("🚀 FlexNotify Scraper starting...")
    init_scrapers()

    interval = int(os.getenv("SCRAPE_INTERVAL_SECONDS", "30"))
    logger.info(f"Polling every {interval} seconds")

    # Schedule jobs
    schedule.every(interval).seconds.do(run_threaded, scrape_amazon)
    schedule.every(interval).seconds.do(run_threaded, scrape_doordash)
    schedule.every(2).minutes.do(run_threaded, verify_delivery_availability)

    # Run immediately on start
    run_threaded(scrape_amazon)
    run_threaded(scrape_doordash)

    logger.info("Scraper running. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
