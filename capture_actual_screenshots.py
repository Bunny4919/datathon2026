import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\konat\Desktop\ksp police"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    print("Navigating to http://localhost:5173 ...")
    page.goto("http://localhost:5173", wait_until="networkidle")
    time.sleep(2)
    
    # Check if login page is presented
    if "login" in page.url or page.locator('button:has-text("Secure Sign In")').count() > 0:
        print("Clicking Secure Sign In on login page...")
        page.click('button:has-text("Secure Sign In")')
        time.sleep(3)
        
    print("Capturing Real Chat Page...")
    page.goto("http://localhost:5173/", wait_until="networkidle")
    time.sleep(3)
    chat_path = os.path.join(output_dir, "real_chat.png")
    page.screenshot(path=chat_path)
    print("Saved:", chat_path)

    print("Capturing Real Analytics Page...")
    page.goto("http://localhost:5173/analytics", wait_until="networkidle")
    time.sleep(3)
    analytics_path = os.path.join(output_dir, "real_analytics.png")
    page.screenshot(path=analytics_path)
    print("Saved:", analytics_path)

    print("Capturing Real Network Graph Page...")
    page.goto("http://localhost:5173/network", wait_until="networkidle")
    time.sleep(4)
    network_path = os.path.join(output_dir, "real_network.png")
    page.screenshot(path=network_path)
    print("Saved:", network_path)

    print("Capturing Real Decision Support Page...")
    page.goto("http://localhost:5173/decision-support", wait_until="networkidle")
    time.sleep(3)
    decision_path = os.path.join(output_dir, "real_decision_support.png")
    page.screenshot(path=decision_path)
    print("Saved:", decision_path)

    browser.close()

print("All actual live application screenshots captured successfully!")
