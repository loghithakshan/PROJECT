#!/usr/bin/env python3
"""
Quick start guide for crowd detection from webcam
"""

import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    required = ['cv2', 'numpy', 'requests']
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"⚠️  Missing packages: {', '.join(missing)}")
        print("\nInstalling requirements...")
        
        pkg_map = {
            'cv2': 'opencv-python',
            'numpy': 'numpy',
            'requests': 'requests'
        }
        
        for pkg in missing:
            pip_pkg = pkg_map.get(pkg, pkg)
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', pip_pkg])
        
        print("✅ Requirements installed!")
    else:
        print("✅ All requirements met!")

def main():
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║     CROWD ASSISTANCE - Webcam Crowd Detection Setup       ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Check requirements
    print("\n1️⃣  Checking requirements...")
    check_requirements()
    
    # Check if demo server is running
    print("\n2️⃣  Verifying demo server is running on :3000...")
    try:
        import requests
        response = requests.get('http://localhost:3000/health', timeout=2)
        if response.status_code == 200:
            print("✅ Demo server is running!")
        else:
            print("⚠️  Demo server returned unexpected status")
    except Exception as e:
        print(f"❌ Demo server not responding: {e}")
        print("   Start it first: cd backend && node demo-server.js")
        return
    
    # Start crowd detection
    print("\n3️⃣  Starting crowd detection...")
    print("   Press 'Q' to exit\n")
    
    from crowd_detector import CrowdDetector
    
    detector = CrowdDetector(demo_server_url="http://localhost:3000")
    detector.run_webcam_detection(camera_index=0, display=True)
    
    print("\n✅ Crowd detection stopped!")

if __name__ == '__main__':
    main()
