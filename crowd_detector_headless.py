"""
Real-Time Crowd Detection from Webcam (Headless Version)
Works without display - Returns results via API
"""

import cv2
import numpy as np
import threading
import requests
import json
from datetime import datetime
from collections import deque
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrowdDetector:
    def __init__(self, demo_server_url="http://localhost:3000"):
        """Initialize crowd detector"""
        self.demo_server_url = demo_server_url
        self.is_running = False
        self.latest_results = {}
        
        try:
            # HOG descriptor for person detection
            self.hog = cv2.HOGDescriptor()
            self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            
            # Background subtractor
            self.fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
            
            logger.info("✅ OpenCV models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
        
        # Running metrics
        self.crowd_density_history = deque(maxlen=30)
        self.movement_history = deque(maxlen=30)
        self.frame_count = 0
        
    def detect_persons(self, frame):
        """Detect persons in frame using HOG"""
        small_frame = cv2.resize(frame, (640, 480))
        
        try:
            detections, weights = self.hog.detectMultiScale(
                small_frame,
                winStride=(8, 8),
                padding=(16, 16),
                scale=1.05
            )
            
            detected_persons = []
            for (x, y, w, h) in detections:
                scale = frame.shape[1] / small_frame.shape[1]
                detected_persons.append({
                    'x': int(x * scale),
                    'y': int(y * scale),
                    'w': int(w * scale),
                    'h': int(h * scale),
                    'confidence': 0.8
                })
            
            return detected_persons
        except Exception as e:
            logger.warning(f"Detection error: {e}")
            return []
    
    def calculate_crowd_density(self, frame, persons):
        """Calculate crowd density percentage"""
        frame_area = frame.shape[0] * frame.shape[1]
        persons_area = sum(p['w'] * p['h'] for p in persons)
        
        density = min(100, (persons_area / frame_area) * 100) if frame_area > 0 else 0
        return density
    
    def detect_movement_anomalies(self, frame):
        """Detect movement anomalies"""
        fgmask = self.fgbg.apply(frame)
        contours, _ = cv2.findContours(fgmask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_pixels = np.count_nonzero(fgmask)
        motion_percentage = (motion_pixels / (fgmask.shape[0] * fgmask.shape[1])) * 100
        
        rapid_changes = 0
        if len(contours) > 5:
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 100:
                    rapid_changes += 1
        
        anomaly_score = min(100, (motion_percentage * 0.6) + (rapid_changes * 5))
        return {'anomaly_score': anomaly_score, 'motion_percentage': motion_percentage}
    
    def process_frame(self, frame):
        """Process frame and return metrics"""
        self.frame_count += 1
        
        persons = self.detect_persons(frame)
        crowd_density = self.calculate_crowd_density(frame, persons)
        movement = self.detect_movement_anomalies(frame)
        
        self.crowd_density_history.append(crowd_density)
        self.movement_history.append(movement['anomaly_score'])
        
        return {
            'person_count': len(persons),
            'crowd_density': crowd_density,
            'movement_anomalies': movement['anomaly_score'],
            'timestamp': datetime.now().isoformat()
        }
    
    def trigger_fight_detection(self, crowd_density, movement_anomalies):
        """Send detection to demo server"""
        try:
            payload = {
                'crowdDensity': int(crowd_density),
                'movementAnomalies': int(movement_anomalies),
                'audioAnalysis': 65,
                'reportsCount': 0
            }
            
            response = requests.post(
                f"{self.demo_server_url}/fight/detect",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"🔥 FIGHT DETECTION TRIGGERED!")
                logger.info(f"   Incident ID: {result['incidentId']}")
                logger.info(f"   Confidence: {result['detectionConfidence']}%")
                logger.info(f"   Security Dispatch: {result['securityDispatch']['teamLocation']}")
                logger.info(f"   ETA: {result['securityDispatch']['estimatedResponseTime']}")
                return result
        except Exception as e:
            logger.error(f"Failed to reach server: {e}")
    
    def run_webcam_detection(self, camera_index=0):
        """Run detection from webcam"""
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            logger.error("❌ Cannot open webcam!")
            return False
        
        logger.info("📹 Starting webcam detection...")
        logger.info(f"📡 Server URL: {self.demo_server_url}")
        
        self.is_running = True
        frame_skip = 3
        frame_buffer = 0
        
        try:
            while self.is_running:
                ret, frame = cap.read()
                
                if not ret:
                    logger.warning("Failed to read frame")
                    break
                
                frame_buffer += 1
                
                if frame_buffer % frame_skip != 0:
                    continue
                
                # Process frame
                detection = self.process_frame(frame)
                self.latest_results = detection
                
                # Calculate averages
                avg_density = np.mean(list(self.crowd_density_history)) if self.crowd_density_history else 0
                avg_movement = np.mean(list(self.movement_history)) if self.movement_history else 0
                
                # Check thresholds
                if avg_density > 40 and avg_movement > 50:
                    logger.warning(f"⚠️  POTENTIAL FIGHT DETECTED!")
                    logger.warning(f"    Crowd Density: {avg_density:.1f}%")
                    logger.warning(f"    Movement Anomalies: {avg_movement:.1f}%")
                    logger.warning(f"    Persons: {detection['person_count']}")
                    
                    self.trigger_fight_detection(avg_density, avg_movement)
                
                # Log progress every 30 frames
                if self.frame_count % 30 == 0:
                    logger.info(f"[Frame {self.frame_count}] Persons: {detection['person_count']} | "
                               f"Density: {avg_density:.1f}% | Movement: {avg_movement:.1f}%")
        
        except KeyboardInterrupt:
            logger.info("⏹️  Stopping detection...")
        
        finally:
            self.is_running = False
            cap.release()
            logger.info("✅ Webcam released")
    
    def get_current_status(self):
        """Get current detection status"""
        if not self.crowd_density_history or not self.movement_history:
            return None
        
        avg_density = np.mean(list(self.crowd_density_history))
        avg_movement = np.mean(list(self.movement_history))
        
        return {
            'frame_count': self.frame_count,
            'persons': self.latest_results.get('person_count', 0),
            'crowd_density': avg_density,
            'movement_anomalies': avg_movement,
            'is_running': self.is_running,
            'alert_status': 'HIGH ALERT' if (avg_density > 40 and avg_movement > 50) else 'NORMAL',
            'timestamp': datetime.now().isoformat()
        }


def main():
    """Main entry point"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║   CROWD ASSISTANCE - Real-Time Webcam Detection          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🎥 Features:                                             ║
║  • Person detection from webcam                          ║
║  • Crowd density analysis                                ║
║  • Movement anomaly detection                            ║
║  • Auto-trigger fight detection                          ║
║  • Auto-dispatch security                                ║
║                                                           ║
║  📡 Server: http://localhost:3000                        ║
║  📊 Metrics updated every frame                          ║
║  🔔 Press Ctrl+C to stop                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    detector = CrowdDetector(demo_server_url="http://localhost:3000")
    
    # Check server health
    try:
        response = requests.get('http://localhost:3000/health', timeout=2)
        if response.status_code == 200:
            logger.info("✅ Demo server is online!")
        else:
            logger.warning("⚠️  Demo server returned unexpected status")
    except Exception as e:
        logger.error(f"❌ Cannot reach demo server: {e}")
        logger.error("   Make sure to run: cd backend && node demo-server.js")
        return
    
    # Check for available camera
    logger.info("\n🔍 Checking for available cameras...")
    camera_found = False
    for i in range(5):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            logger.info(f"✅ Camera found at index {i}")
            camera_found = True
            cap.release()
            
            logger.info(f"\n▶️  Starting detection with camera {i}...\n")
            detector.run_webcam_detection(camera_index=i)
            break
    
    if not camera_found:
        logger.error("❌ No camera found! Please check:")
        logger.error("   1. Webcam is plugged in")
        logger.error("   2. No other app is using the camera")
        logger.error("   3. Camera permissions are enabled")


if __name__ == '__main__':
    main()
