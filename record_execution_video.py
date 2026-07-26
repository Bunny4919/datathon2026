import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\konat\Desktop\ksp police"
video_dir = os.path.join(output_dir, "recordings")
os.makedirs(video_dir, exist_ok=True)

print("Starting video recording of prototype execution...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=video_dir,
        record_video_size={"width": 1440, "height": 900}
    )
    
    page = context.new_page()
    
    # 1. Login Page
    print("[1/8] Opening Login Page...")
    page.goto("http://localhost:5173/login", wait_until="networkidle")
    time.sleep(2)
    page.click('button:has-text("Secure Sign In")')
    time.sleep(3)

    # 2. Conversational Chatbot Page & SQL Debugger
    print("[2/8] Demonstrating Conversational AI & SQL Debugger...")
    page.goto("http://localhost:5173/", wait_until="networkidle")
    time.sleep(2)
    
    # Type sample query
    page.fill('input[type="text"]', "How many FIRs are registered in Bengaluru?")
    time.sleep(1)
    page.click('button:has-text("Submit")')
    time.sleep(4)

    # Select Kannada language
    page.select_option('select', 'kn')
    time.sleep(2)

    # 3. Hotspot Analytics & Socio-Demographics
    print("[3/8] Demonstrating Hotspot Analytics & Socio-Demographics...")
    page.goto("http://localhost:5173/analytics", wait_until="networkidle")
    time.sleep(4)

    # 4. Criminal Network Graph Analysis
    print("[4/8] Demonstrating Criminal Network Graph Visualizer...")
    page.goto("http://localhost:5173/network", wait_until="networkidle")
    time.sleep(5)

    # 5. Offender Profiling & Habitual Risk Scoring
    print("[5/8] Demonstrating Offender Behavioral Profiling...")
    page.goto("http://localhost:5173/profiles", wait_until="networkidle")
    time.sleep(4)

    # 6. Financial Crime & Transaction Link Analysis
    print("[6/8] Demonstrating Financial Transaction Analysis...")
    page.goto("http://localhost:5173/financials", wait_until="networkidle")
    time.sleep(4)

    # 7. Predictive Crime Forecasting & Early Warnings
    print("[7/8] Demonstrating Predictive Crime Forecasting (ARIMA)...")
    page.goto("http://localhost:5173/forecast", wait_until="networkidle")
    time.sleep(4)

    # 8. Investigator Decision Support & Case Similarity Search
    print("[8/8] Demonstrating Decision Support & Case Timelines...")
    page.goto("http://localhost:5173/decision-support", wait_until="networkidle")
    time.sleep(4)

    # Return to Main Chat
    page.goto("http://localhost:5173/", wait_until="networkidle")
    time.sleep(2)

    video_path = page.video.path()
    context.close()
    browser.close()

# Rename final video
final_video = os.path.join(output_dir, "KSP_Prototype_Execution_Demo.webm")
if os.path.exists(video_path):
    import shutil
    shutil.copy(video_path, final_video)
    print(f"Video recording completed successfully!")
    print(f"Saved video to: {final_video}")
else:
    print("Video path not found.")
