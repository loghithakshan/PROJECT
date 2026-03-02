"""
Real-Time Crowd Detection from Webcam
Detects crowds, crowd density, movement anomalies, and triggers alerts
"""

import cv2
import numpy as np
import threading
import requests
import json
from datetime import datetime
from collections import deque
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrowdDetector:
    def __init__(self, demo_server_url="http://localhost:3000"):
        """Initialize crowd detector with HOG person detector and optical flow"""
        self.demo_server_url = demo_server_url
        
        # HOG descriptor for person detection (lightweight, no GPU needed)
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
        # Background subtractor for movement detection
        self.fgbg = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        
        # Optical flow for detailed movement analysis
        self.prev_gray = None
        self.prev_points = None
        
        # Running metrics
        self.crowd_density_history = deque(maxlen=30)  # Last 30 frames
        self.movement_history = deque(maxlen=30)
        self.audio_level = 0
        self.reports_count = 0
        
        # Frame tracking
        self.frame_count = 0
        self.detection_threshold = 0.5  # Confidence threshold
        
    def detect_persons(self, frame):
        """Detect persons in frame using HOG descriptor"""
        # Resize for faster processing
        small_frame = cv2.resize(frame, (640, 480))
        
        # Detect humans
        detections, weights = self.hog.detectMultiScale(
            small_frame,
            winStride=(8, 8),
            padding=(16, 16),
            scale=1.05
        )
        
        # Scale back to original size
        detected_persons = []
        for (x, y, w, h) in detections:
            scale = frame.shape[1] / small_frame.shape[1]
            detected_persons.append({
                'x': int(x * scale),
                'y': int(y * scale),
                'w': int(w * scale),
                'h': int(h * scale),
                'confidence': float(weights[0]) if len(weights) > 0 else 0.8
            })
        
        return detected_persons
    
    def calculate_crowd_density(self, frame, persons):
        """Calculate crowd density as percentage of frame covered"""
        frame_area = frame.shape[0] * frame.shape[1]
        persons_area = sum(p['w'] * p['h'] for p in persons)
        
        density_percentage = min(100, (persons_area / frame_area) * 100) if frame_area > 0 else 0
        return density_percentage
    
    def detect_movement_anomalies(self, frame):
        """Detect unusual movement patterns using optical flow"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Background subtraction for motion detection
        fgmask = self.fgbg.apply(frame)
        contours, _ = cv2.findContours(fgmask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Calculate motion intensity
        motion_pixels = np.count_nonzero(fgmask)
        motion_percentage = (motion_pixels / (fgmask.shape[0] * fgmask.shape[1])) * 100
        
        # Detect rapid direction changes (fight indicator)
        rapid_changes = 0
        if len(contours) > 5:  # Multiple moving objects
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 100:  # Filter noise
                    rapid_changes += 1
        
        # Anomaly score: 0-100
        anomaly_score = min(100, (motion_percentage * 0.6) + (rapid_changes * 5))
        
        return {
            'motion_percentage': motion_percentage,
            'rapid_changes': rapid_changes,
            'anomaly_score': anomaly_score
        }
    
    def process_frame(self, frame):
        """Process single frame for crowd detection"""
        self.frame_count += 1
        
        # Step 1: Detect persons
        persons = self.detect_persons(frame)
        crowd_density = self.calculate_crowd_density(frame, persons)
        
        # Step 2: Detect movement anomalies
        movement = self.detect_movement_anomalies(frame)
        
        # Step 3: Calculate metrics
        person_count = len(persons)
        movement_anomaly_score = movement['anomaly_score']
        
        # Store history for trend analysis
        self.crowd_density_history.append(crowd_density)
        self.movement_history.append(movement_anomaly_score)
        
        return {
            'person_count': person_count,
            'crowd_density': crowd_density,
            'movement_anomalies': movement_anomaly_score,
            'persons': persons,
            'movement_details': movement,
            'timestamp': datetime.now().isoformat()
        }
    
    def run_webcam_detection(self, camera_index=0, display=True):
        """
        Run real-time crowd detection from webcam
        
        Args:
            camera_index: Webcam index (0 = default)
            display: Show video output or not
        """
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            logger.error("Cannot open webcam!")
            return
        
        logger.info("Starting real-time crowd detection from webcam...")
        logger.info(f"Demo server URL: {self.demo_server_url}")
        
        frame_skip = 3  # Process every 3rd frame for speed
        frame_buffer = 0
        
        try:
            while True:
                ret, frame = cap.read()
                
                if not ret:
                    logger.warning("Failed to read frame")
                    break
                
                frame_buffer += 1
                
                # Process every Nth frame
                if frame_buffer % frame_skip != 0:
                    continue
                
                # Process current frame
                detection_result = self.process_frame(frame)
                
                # Calculate average metrics
                avg_crowd_density = np.mean(list(self.crowd_density_history)) if self.crowd_density_history else 0
                avg_movement = np.mean(list(self.movement_history)) if self.movement_history else 0
                
                # Decision: Trigger fight detection?
                if avg_crowd_density > 40 and avg_movement > 50:
                    logger.warning(f"🔥 POTENTIAL FIGHT DETECTED!")
                    logger.warning(f"   Crowd Density: {avg_crowd_density:.1f}%")
                    logger.warning(f"   Movement Anomalies: {avg_movement:.1f}%")
                    logger.warning(f"   Persons detected: {detection_result['person_count']}")
                    
                    # Send to demo server
                    self.trigger_fight_detection(
                        crowd_density=int(avg_crowd_density),
                        movement_anomalies=int(avg_movement),
                        audio_analysis=65,  # Would come from microphone
                        reports_count=0
                    )
                
                # Display info on frame
                if display:
                    frame = self.draw_detection_info(frame, detection_result, avg_crowd_density, avg_movement)
                    cv2.imshow('CROWD ASSISTANCE - Crowd Detection', frame)
                
                # Exit on 'q'
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                # Log progress
                if self.frame_count % 30 == 0:
                    logger.info(f"[Frame {self.frame_count}] Persons: {detection_result['person_count']} | "
                               f"Density: {avg_crowd_density:.1f}% | Movement: {avg_movement:.1f}%")
        
        except KeyboardInterrupt:
            logger.info("Stopping crowd detection...")
        
        finally:
            cap.release()
            cv2.destroyAllWindows()
            logger.info("Webcam released")
    
    def draw_detection_info(self, frame, detection, density, movement):
        """Draw detection info on frame"""
        # Draw title
        cv2.putText(frame, 'CROWD ASSISTANCE - Webcam Detection', (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Draw metrics
        metrics = [
            f"Persons: {detection['person_count']}",
            f"Crowd Density: {density:.1f}%",
            f"Movement Anomalies: {movement:.1f}%",
            f"Frame: {self.frame_count}",
            f"Status: {'⚠️ HIGH ALERT' if movement > 50 and density > 40 else '✓ NORMAL'}"
        ]
        
        for i, metric in enumerate(metrics):
            y_pos = 70 + (i * 30)
            color = (0, 0, 255) if (movement > 50 and density > 40) else (0, 255, 0)
            cv2.putText(frame, metric, (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Draw bounding boxes for detected persons
        for person in detection['persons'][:20]:  # Limit for visual clarity
            x, y, w, h = person['x'], person['y'], person['w'], person['h']
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Draw alert zone if high density + movement
        if movement > 50 and density > 40:
            cv2.rectangle(frame, (5, 5), (frame.shape[1]-5, frame.shape[0]-5), (0, 0, 255), 3)
        
        return frame
    
    def trigger_fight_detection(self, crowd_density, movement_anomalies, audio_analysis, reports_count):
        """Send detection to demo server's fight detection endpoint"""
        try:
            payload = {
                'crowdDensity': crowd_density,
                'movementAnomalies': movement_anomalies,
                'audioAnalysis': audio_analysis,
                'reportsCount': reports_count
            }
            
            response = requests.post(
                f"{self.demo_server_url}/fight/detect",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Fight detection triggered: {result['incidentId']}")
                logger.info(f"   Confidence: {result['detectionConfidence']}%")
                logger.info(f"   Security dispatch: {result['securityDispatch']['teamLocation']}")
                return result
            else:
                logger.error(f"Error from server: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Failed to reach demo server: {e}")
    
    def analyze_crowd_state(self):
        """Get current crowd state summary"""
        if not self.crowd_density_history or not self.movement_history:
            return None
        
        return {
            'avg_crowd_density': float(np.mean(list(self.crowd_density_history))),
            'max_crowd_density': float(np.max(list(self.crowd_density_history))),
            'avg_movement_anomalies': float(np.mean(list(self.movement_history))),
            'max_movement_anomalies': float(np.max(list(self.movement_history))),
            'frames_processed': self.frame_count,
            'alert_status': 'HIGH' if (np.mean(list(self.movement_history)) > 50 and 
                                       np.mean(list(self.crowd_density_history)) > 40) else 'NORMAL'
        }


def main():
    """Main entry point"""
    detector = CrowdDetector(demo_server_url="http://localhost:3000")
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║        CROWD ASSISTANCE - Webcam Crowd Detection         ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║  🎥 Real-time Features:                                 ║
    ║  • Detect persons in crowded areas                       ║
    ║  • Measure crowd density percentage                      ║
    ║  • Analyze movement anomalies                            ║
    ║  • Auto-trigger fight detection when:                    ║
    ║     - Crowd Density > 40%                                ║
    ║     - Movement Anomalies > 50%                           ║
    ║    → Automatically sends to demo server                  ║
    ║                                                           ║
    ║  🎮 Controls:                                             ║
    ║  • Press 'Q' to stop detection                           ║
    ║  • Green box = Normal | Red box = Alert                  ║
    ║                                                           ║
    ║  📡 Integrates with: http://localhost:3000               ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Try to use webcam
    print("\n📹 Attempting to access default webcam (index 0)...")
    print("    Press 'Q' to stop, or hit Ctrl+C\n")
    
    detector.run_webcam_detection(camera_index=0, display=True)


if __name__ == '__main__':
    main()
