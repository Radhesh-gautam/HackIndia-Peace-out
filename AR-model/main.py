import cv2
import json
import os
import numpy as np
import pyttsx3
import threading
import shutil
import queue
import time
import math
import random
from deepface import DeepFace

# File paths
DATA_FILE = "faces_data.json"
KNOWN_FACES_DIR = "known_faces"
MEDICINES_DIR = "medicines"
MED_DATA_FILE = "medicines_data.json"

# Ensure directories exist
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
os.makedirs(MEDICINES_DIR, exist_ok=True)

if not os.path.exists(MED_DATA_FILE):
    with open(MED_DATA_FILE, 'w') as f: json.dump({"medicines": []}, f)

# Load OpenCV face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# In-memory face database
known_faces = []

# Thread-safe TTS
_tts_lock = threading.Lock()

def speak_info(text):
    def run_tts():
        with _tts_lock:
            engine = pyttsx3.init()
            engine.say(text)
            engine.runAndWait()
            engine.stop()
    tts_thread = threading.Thread(target=run_tts, daemon=True)
    tts_thread.start()

def load_data():
    global known_faces
    known_faces = []
    if not os.path.exists(DATA_FILE): return
    with open(DATA_FILE, 'r') as f:
        try: data = json.load(f)
        except: data = {}
    for name, info in data.items():
        image_path = info.get("image_path")
        if image_path and os.path.exists(image_path):
            known_faces.append({
                "name": name,
                "relationship": info.get("relationship", "Unknown"),
                "image_path": image_path,
                "last_seen": info.get("last_seen", "Never"),
                "summary": info.get("summary", "No previous interaction."),
                "medicine": info.get("medicine", ""),
                "medicine_img": info.get("medicine_img", "")
            })

CHAT_SAMPLES = [
    "Discussed the morning weather.",
    "Talked about the latest news.",
    "Shared a quick joke and laughed.",
    "Reminded about daily medicine.",
    "Planned for the upcoming weekend.",
    "Talked about their favorite meal.",
    "Discussed a recent TV show.",
    "Had a friendly morning greeting."
]

def update_interaction(name):
    """Update JSON with new timestamp and random chat info."""
    if not os.path.exists(DATA_FILE): return
    with open(DATA_FILE, 'r') as f: data = json.load(f)
    if name in data:
        data[name]["last_seen"] = time.strftime("%Y-%m-%d %H:%M")
        data[name]["summary"] = random.choice(CHAT_SAMPLES)
        with open(DATA_FILE, 'w') as f: json.dump(data, f, indent=4)
        load_data()

def save_new_face(frame, face_location, name, relationship):
    x, y, w, h = face_location
    pad = 20
    fh, fw = frame.shape[:2]
    t, b, l, r = max(0, y-pad), min(fh, y+h+pad), max(0, x-pad), min(fw, x+w+pad)
    face_image = frame[t:b, l:r]
    image_filename = f"{name.replace(' ', '_')}.jpg"
    image_path = os.path.join(KNOWN_FACES_DIR, image_filename)
    cv2.imwrite(image_path, face_image)
    
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try: data = json.load(f)
            except: data = {}
    else: data = {}
    data[name] = {"relationship": relationship, "image_path": image_path, "last_seen": time.strftime("%Y-%m-%d %H:%M"), "summary": "Just added."}
    with open(DATA_FILE, 'w') as f: json.dump(data, f, indent=4)
    load_data()

def recognize_face_in_memory(face_img):
    if not known_faces: return "Unknown", "", "", ""
    best_name, best_rel, best_last, best_sum, best_dist = "Unknown", "", "", "", float("inf")
    # Using Facenet512 for much higher accuracy
    for entry in known_faces:
        try:
            result = DeepFace.verify(
                img1_path=face_img, 
                img2_path=entry["image_path"], 
                model_name="Facenet512", 
                enforce_detection=False, 
                detector_backend="opencv",
                silent=True
            )
            dist = result.get("distance", float("inf"))
            # Threshold for Facenet512 is tighter (usually around 0.3)
            if result.get("verified", False) and dist < 0.3:
                best_dist, best_name, best_rel, best_last, best_sum = dist, entry["name"], entry["relationship"], entry["last_seen"], entry["summary"]
        except: continue
    return best_name, best_rel, best_last, best_sum

# --- High-Accuracy Multi-Image Medicine Matching Logic ---
def check_all_medicines(current_frame):
    """SIFT-based matching with Ratio Test and Contrast Enhancement."""
    if not os.path.exists(MED_DATA_FILE): return None, 0, "No database."
    with open(MED_DATA_FILE, 'r') as f: data = json.load(f)
    saved_meds = data.get("medicines", [])
    if not saved_meds: return None, 0, "No medicines saved."
    
    # 1. Pre-process Current Frame (Focus ROI + CLAHE)
    h, w = current_frame.shape[:2]
    cw, ch = 512, 512
    # Crop center 80% to ignore background
    roi_h, roi_w = int(h*0.8), int(w*0.8)
    y1, x1 = (h-roi_h)//2, (w-roi_w)//2
    curr_roi = current_frame[y1:y1+roi_h, x1:x1+roi_w]
    curr_roi = cv2.resize(curr_roi, (cw, ch))
    
    curr_gray = cv2.cvtColor(curr_roi, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    curr_gray = clahe.apply(curr_gray)
    
    sift = cv2.SIFT_create()
    kp_curr, des_curr = sift.detectAndCompute(curr_gray, None)
    if des_curr is None or len(kp_curr) < 10: return None, 0, "No clear features."
    
    # FLANN Matcher setup
    FLANN_INDEX_KDTREE = 1
    index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    best_match, max_confidence = None, 0

    for med in saved_meds:
        try:
            ref_img = cv2.imread(med["image_path"])
            if ref_img is None: continue
            
            ref_roi = cv2.resize(ref_img, (cw, ch))
            ref_gray = clahe.apply(cv2.cvtColor(ref_roi, cv2.COLOR_BGR2GRAY))
            kp_ref, des_ref = sift.detectAndCompute(ref_gray, None)
            if des_ref is None: continue
            
            # KNN Matching
            matches = flann.knnMatch(des_ref, des_curr, k=2)
            
            # Lowe's Ratio Test
            good_matches = []
            for m, n in matches:
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)
            
            conf = len(good_matches) / len(kp_ref) if len(kp_ref) > 0 else 0
            if conf > max_confidence: max_confidence, best_match = conf, med
        except: continue
        
    # Threshold for SIFT + Ratio Test is usually lower (e.g. 0.05 - 0.15 is high for SIFT)
    if best_match and max_confidence > 0.08: 
        return best_match["name"], max_confidence, f"Correct: {best_match['name']}"
    elif best_match: 
        return best_match["name"], max_confidence, "Wrong Medicine!"
    else: return None, 0, "No Match Found."

# Asynchronous Recognition
recognition_queue = queue.Queue()
def recognition_worker():
    while True:
        job = recognition_queue.get()
        if job is None: break
        state_ref, face_crop = job
        name, rel, last, summary = recognize_face_in_memory(face_crop)
        
        if name != "Unknown":
            # Always update metadata from the current known_faces entry
            entry = next((e for e in known_faces if e["name"] == name), None)
            if entry:
                state_ref.name = name
                state_ref.rel = entry["relationship"]
                state_ref.last_seen = entry["last_seen"]
                state_ref.summary = entry["summary"]
                state_ref.medicine = entry.get("medicine", "")
            
            # Only update the DB summary ONCE per session for this face
            if not state_ref.summary_updated:
                update_interaction(name)
                state_ref.summary_updated = True
                # Refresh metadata again after update_interaction (which calls load_data)
                entry = next((e for e in known_faces if e["name"] == name), None)
                if entry:
                    state_ref.last_seen = entry["last_seen"]
                    state_ref.summary = entry["summary"]
        else:
            # If it was already known, DON'T reset to Unknown on a single bad check
            # This prevents "guessing" flicker. 
            pass
            
        state_ref.frames_since_recognition, state_ref.is_processing = 0, False
        recognition_queue.task_done()

worker_thread = threading.Thread(target=recognition_worker, daemon=True)
worker_thread.start()

class FaceState:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
        self.target_x, self.target_y, self.target_w, self.target_h = x, y, w, h
        self.name, self.rel, self.last_seen, self.summary, self.medicine = "Unknown", "", "", "", ""
        self.alpha, self.active_frames, self.lost_frames = 0.0, 0, 0
        self.is_processing, self.frames_since_recognition = False, 0
        self.summary_updated = False

class FaceTracker:
    def __init__(self): self.states = []
    def update(self, detected_boxes):
        matched = set()
        for tx, ty, tw, th in detected_boxes:
            best_s, best_d = None, float('inf')
            for s in self.states:
                if s in matched: continue
                d = math.hypot((tx+tw/2)-(s.target_x+s.target_w/2), (ty+th/2)-(s.target_y+s.target_h/2))
                if d < min(tw, s.target_w)*1.5 and d < best_d: best_d, best_s = d, s
            if best_s:
                best_s.target_x, best_s.target_y, best_s.target_w, best_s.target_h, best_s.lost_frames = tx, ty, tw, th, 0
                matched.add(best_s)
            else:
                ns = FaceState(tx, ty, tw, th)
                self.states.append(ns); matched.add(ns)
        for s in self.states:
            if s not in matched: s.lost_frames += 1
        self.states = [s for s in self.states if not (s.lost_frames >= 15 and s.alpha <= 0)]
    def step(self):
        for s in self.states:
            s.x += (s.target_x-s.x)*0.3; s.y += (s.target_y-s.y)*0.3; s.w += (s.target_w-s.w)*0.3; s.h += (s.target_h-s.h)*0.3
            if s.lost_frames > 0: s.alpha = max(0.0, s.alpha-0.1)
            else: s.alpha = min(1.0, s.alpha+0.1); s.active_frames += 1

def draw_modern_overlay(frame, state):
    x, y, w, h = int(state.x), int(state.y), int(state.w), int(state.h)
    if state.alpha <= 0: return
    accent = (250, 210, 180) if state.name != "Unknown" else (150, 150, 250)
    fh, fw = frame.shape[:2]
    cl = int(w * 0.15)
    pts = [[(x,y+cl),(x,y),(x+cl,y)],[(x+w-cl,y),(x+w,y),(x+w,y+cl)],[(x,y+h-cl),(x,y+h),(x+cl,y+h)],[(x+w-cl,y+h),(x+w,y+h),(x+w,y+h-cl)]]
    overlay = frame.copy()
    for p in pts:
        for i in range(len(p)-1): cv2.line(overlay, p[i], p[i+1], accent, 2, cv2.LINE_AA)
    if state.alpha < 1.0: cv2.addWeighted(overlay, state.alpha, frame, 1-state.alpha, 0, frame)
    else: frame[:] = overlay

    label_m = state.name
    # Only show "Identifying..." if we don't have a name yet.
    # If we already have a name, do background re-recognition silently.
    if state.is_processing and state.name == "Unknown":
        label_s, label_i, label_d, label_m_info = "Identifying...", "", "", ""
    else:
        label_s = state.rel if state.rel else ("Detecting..." if state.name == "Unknown" else "Verified")
        label_i, label_d = (state.summary, f"Last: {state.last_seen}") if state.name != "Unknown" else ("","")
        label_m_info = f"Med: {state.medicine}" if state.name != "Unknown" and state.medicine else ""

    font = cv2.FONT_HERSHEY_DUPLEX
    (tw_m, th_m), _ = cv2.getTextSize(label_m, font, 0.55, 1)
    (tw_s, th_s), _ = cv2.getTextSize(label_s, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
    (tw_i, th_i), _ = cv2.getTextSize(label_i, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
    (tw_d, th_d), _ = cv2.getTextSize(label_d, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)
    (tw_mi, th_mi), _ = cv2.getTextSize(label_m_info, cv2.FONT_HERSHEY_SIMPLEX, 0.35, 1)
    
    cw = max(tw_m, tw_s, tw_i, tw_d, tw_mi) + 40
    ch = th_m + th_s + (th_i+10 if label_i else 0) + (th_d+10 if label_d else 0) + (th_mi+10 if label_m_info else 0) + 30
    
    cx, cy = max(0, min(x+w+15, fw-cw)), max(10, min(y+h//2-ch//2, fh-ch-10))
    roi = frame[cy:cy+ch, cx:cx+cw]
    if roi.size > 0:
        sub = roi.copy()
        try:
            b = cv2.GaussianBlur(roi, (9,9), 0)
            sub = cv2.addWeighted(b, 0.4, np.full(roi.shape, (245,245,245), dtype=np.uint8), 0.6, 0)
        except: sub[:] = (245,245,245)
        cv2.rectangle(sub, (0,0), (cw-1,ch-1), (255,255,255), 1, cv2.LINE_AA)
        tx, cur_y = 20, 20+th_m
        cv2.putText(sub, label_m, (tx, cur_y), font, 0.55, (20,20,20), 1, cv2.LINE_AA)
        cur_y += th_s+8
        cv2.putText(sub, label_s, (tx, cur_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100,100,100), 1, cv2.LINE_AA)
        if label_i: cur_y += th_i+10; cv2.putText(sub, label_i, (tx, cur_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100,100,100), 1, cv2.LINE_AA)
        if label_d: cur_y += th_d+10; cv2.putText(sub, label_d, (tx, cur_y), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100,100,100), 1, cv2.LINE_AA)
        if label_m_info: cur_y += th_mi+10; cv2.putText(sub, label_m_info, (tx, cur_y), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,0,200), 1, cv2.LINE_AA)
        cv2.addWeighted(sub, state.alpha, roi, 1-state.alpha, 0, roi)

def main():
    load_data()
    # video_capture = cv2.VideoCapture(0)
    video_capture = cv2.VideoCapture("http://192.168.245.174:4747/video", cv2.CAP_FFMPEG)
    video_capture.set(3, 640); video_capture.set(4, 480)
    print("\n[M] Save Med [C] Check All [Q] Quit")
    PROCESS_EVERY_N, frame_count, tracker = 8, 0, FaceTracker()
    alert_time, alert_msg, alert_color, med_save_trigger = 0, "", (0,0,0), 0

    while True:
        ret, frame = video_capture.read()
        if not ret: break
        frame_count += 1; display_frame = frame.copy()

        if frame_count % PROCESS_EVERY_N == 0:
            small = cv2.resize(frame, (0,0), fx=0.5, fy=0.5)
            detected = face_cascade.detectMultiScale(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), 1.1, 5, minSize=(40,40))
            tracker.update([(fx*2, fy*2, fw*2, fh*2) for (fx, fy, fw, fh) in detected])
        tracker.step()

        fh, fw = frame.shape[:2]
        active = [s for s in tracker.states if s.lost_frames == 0]
        for s in active:
            s.frames_since_recognition += 1
            # Only trigger recognition if truly needed to avoid flickering "identifying"
            if not s.is_processing:
                # If unknown, check often. If known, check less frequently to stay stable.
                need_check = (s.name == "Unknown" and s.active_frames % 10 == 0) or (s.frames_since_recognition > 60)
                if need_check:
                    pad = 10
                    t, b, l, r = max(0, int(s.target_y)-pad), min(fh, int(s.target_y+s.target_h)+pad), max(0, int(s.target_x)-pad), min(fw, int(s.target_x+s.target_w)+pad)
                    if b > t and r > l: 
                        recognition_queue.put((s, frame[t:b, l:r].copy()))
                        s.is_processing = True

        if med_save_trigger > 0:
            
            if time.time() < med_save_trigger:
                cv2.rectangle(display_frame, (0, 30), (fw, 80), (50, 150, 255), -1)
                cv2.putText(display_frame, "Capturing global medicine...", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
            else:
                ts = int(time.time()); med_name = f"Med_{ts}"; med_path = os.path.join(MEDICINES_DIR, f"med_{ts}.jpg")
                cv2.imwrite(med_path, frame)
                with open(MED_DATA_FILE, 'r') as f: mdata = json.load(f)
                mdata["medicines"].append({"name": med_name, "image_path": med_path})
                with open(MED_DATA_FILE, 'w') as f: json.dump(mdata, f, indent=4)
                speak_info("Medicine saved globally."); alert_time, alert_msg, alert_color, med_save_trigger = time.time()+3.0, f"Saved: {med_name}", (255,150,50), 0

        for s in tracker.states: draw_modern_overlay(display_frame, s)
        if time.time() < alert_time:
            overlay = display_frame.copy(); cv2.rectangle(overlay, (0,0), (fw, 60), alert_color, -1)
            cv2.addWeighted(overlay, 0.8, display_frame, 0.2, 0, display_frame)
            cv2.putText(display_frame, alert_msg, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2, cv2.LINE_AA)

        hud = f"Faces: {len(active)} | [M] Save Med [C] Check All"
        cv2.rectangle(display_frame, (0, fh-30), (fw, fh), (0,0,0), -1)
        cv2.putText(display_frame, hud, (10, fh-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,200), 1)
        cv2.imshow('Face Recognition System', display_frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'): break
        elif key == ord('r'): load_data()
        elif key == ord('p'):
            rec = [s for s in active if s.name != "Unknown"]
            if rec:
                for s in rec: speak_info(f"This is {s.name}, your {s.rel}." if s.rel else f"This is {s.name}.")
            else: speak_info("No known faces detected.")
        elif key == ord('a'):
            # Find the closest face to add
            if active:
                best_s = max(active, key=lambda s: s.w * s.h)
                cv2.destroyAllWindows()
                name = input("Enter Name: ")
                rel = input("Enter Relationship: ")
                save_new_face(frame, (int(best_s.x), int(best_s.y), int(best_s.w), int(best_s.h)), name, rel)
                print(f"Added {name}!")
            else: print("No face detected to add.")

        elif key == ord('m'): med_save_trigger = time.time() + 1.5
        elif key == ord('c'):
            name, conf, msg = check_all_medicines(frame)
            alert_time = time.time() + 4.0
            if name:
                disp_conf = min(100, int(conf * 500)) 
                alert_msg, alert_color = f"{msg} ({disp_conf}%)", (50, 180, 50) if conf > 0.08 else (50, 50, 220)
                speak_info(f"Detected {name}" if conf > 0.08 else "Wrong medicine detected.")
            else: alert_msg, alert_color = msg, (100,100,100); speak_info(msg)

    video_capture.release(); cv2.destroyAllWindows()

if __name__ == '__main__':
    main()