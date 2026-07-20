import math
import time
from cursor_controller import CursorController
from deep_translator import GoogleTranslator


def detect_asl_letter(hand):
    thumb_up = hand[4]['y'] < hand[3]['y']
    index_up = hand[8]['y'] < hand[6]['y']
    middle_up = hand[12]['y'] < hand[10]['y']
    ring_up = hand[16]['y'] < hand[14]['y']
    pinky_up = hand[20]['y'] < hand[18]['y']

    if not index_up and not middle_up and not ring_up and not pinky_up:
        if abs(hand[4]['x'] - hand[5]['x']) > 0.05:
            return "A"
    if index_up and middle_up and ring_up and pinky_up:
        if hand[4]['x'] > hand[17]['x'] - 0.1:
            return "B"
    if index_up and not middle_up and not ring_up and not pinky_up:
        if abs(hand[4]['x'] - hand[5]['x']) > 0.08:
            return "L"
    if index_up and middle_up and not ring_up and not pinky_up:
        dist = math.sqrt((hand[8]['x'] - hand[12]['x']) ** 2 + (hand[8]['y'] - hand[12]['y']) ** 2)
        if dist > 0.05:
            return "V"
    if index_up and middle_up and ring_up and not pinky_up:
        return "W"
    if not index_up and not middle_up and not ring_up and pinky_up:
        if abs(hand[4]['x'] - hand[5]['x']) > 0.08:
            return "Y"
    return None


class GestureEngine:
    def __init__(self):
        self.last_command_time = 0.0
        self.cooldown = 1.0
        self.cursor = CursorController()

        self.pinched_start = None
        self.last_scroll_y = None

        self.current_holding_intent = None
        self.hold_start_time = None
        self.hold_threshold = 0.8

    def _evaluate_hold(self, pose_name, intent_payload, current_time):
        if self.current_holding_intent != pose_name:
            self.current_holding_intent = pose_name
            self.hold_start_time = current_time
            return {"status": "listening", "pose": pose_name, "progress": 0.0, "confidence": 0.85}

        duration = current_time - self.hold_start_time
        progress = min(1.0, duration / self.hold_threshold)

        if progress >= 1.0:
            if current_time - self.last_command_time > self.cooldown:
                self.last_command_time = current_time
                self.current_holding_intent = None
                intent_payload["status"] = "confirmed"
                intent_payload["pose"] = pose_name
                intent_payload["progress"] = 1.0
                return intent_payload
            else:
                return {"status": "cooldown", "pose": pose_name, "progress": 1.0}
        return {"status": "holding", "pose": pose_name, "progress": progress, "confidence": 0.9}

    def process(self, landmarks_data, target_lang="en"):
        result = self._detect(landmarks_data)
        if target_lang != "en" and result:
            try:
                if "transcription" in result and result["transcription"]:
                    result["transcription"] = GoogleTranslator(source='auto', target=target_lang).translate(result["transcription"])
                if "text" in result and result["text"]:
                    base_text = result["text"].strip()
                    translated = GoogleTranslator(source='auto', target=target_lang).translate(base_text)
                    result["text"] = translated + " " if result["text"].endswith(" ") else translated
            except Exception:
                pass
        return result

    def _detect(self, landmarks_data):
        if not landmarks_data or len(landmarks_data) == 0:
            self.current_holding_intent = None
            return {"status": "idle", "transcription": "No hand detected. Guidance: Raise your hand to frame.", "confidence": 0}

        hand = landmarks_data[0]
        if len(hand) < 21:
            return {"status": "idle", "transcription": "Analyzing hand landmarks...", "confidence": 0.3}

        thumb_tip = hand[4]
        index_tip = hand[8]
        middle_tip = hand[12]
        ring_tip = hand[16]
        pinky_tip = hand[20]
        wrist = hand[0]

        dx = thumb_tip['x'] - index_tip['x']
        dy = thumb_tip['y'] - index_tip['y']
        distance = math.sqrt(dx * dx + dy * dy)
        current_time = time.time()

        index_up = index_tip['y'] < hand[6]['y']
        middle_up = middle_tip['y'] < hand[10]['y']
        ring_up = ring_tip['y'] < hand[14]['y']
        pinky_up = pinky_tip['y'] < hand[18]['y']
        ring_down = not ring_up
        pinky_down = not pinky_up

        # Fist / stop tracking
        if not index_up and not middle_up and pinky_down:
            self.cursor.toggle_active(False)
            self.current_holding_intent = None
            return {"status": "conflict", "pose": "Closed Fist", "transcription": "Tracking Paused (Fist)", "confidence": 0.95}
        self.cursor.toggle_active(True)

        # Cursor control and scrolling
        self.cursor.update_cursor(index_tip['x'], index_tip['y'])

        if index_up and middle_up and ring_down and pinky_down:
            dist_im = math.sqrt((index_tip['x'] - middle_tip['x']) ** 2 + (index_tip['y'] - middle_tip['y']) ** 2)
            if dist_im < 0.08:
                self.current_holding_intent = None
                avg_y = (index_tip['y'] + middle_tip['y']) / 2
                if self.last_scroll_y is None:
                    self.last_scroll_y = avg_y
                else:
                    delta_y = self.last_scroll_y - avg_y
                    self.last_scroll_y = avg_y
                    if abs(delta_y) > 0.005:
                        direction = 1 if delta_y > 0 else -1
                        self.cursor.scroll(direction)
                        return {"status": "holding", "pose": "Two Fingers Scroll", "transcription": "Scrolling...", "command": "scroll"}
            else:
                self.last_scroll_y = None
        else:
            self.last_scroll_y = None

        # Pinch / drag
        if distance < 0.05:
            self.current_holding_intent = None
            if self.pinched_start is None:
                self.pinched_start = current_time
                return {"status": "listening", "pose": "Pinch"}
            if current_time - self.pinched_start > 0.25:
                self.cursor.mouse_down()
                return {"status": "holding", "pose": "Pinch Drag", "transcription": "Dragging...", "command": "drag", "progress": 1.0}
        else:
            if self.pinched_start is not None:
                duration = current_time - self.pinched_start
                self.pinched_start = None
                if duration <= 0.25:
                    if current_time - self.last_command_time > 0.5:
                        self.last_command_time = current_time
                        self.cursor.click()
                        return {"status": "confirmed", "pose": "Click", "transcription": "Cursor Click!", "command": "click"}
                else:
                    self.cursor.mouse_up()
                    return {"status": "confirmed", "pose": "Drop", "transcription": "Dropped", "command": "drop"}

        # Basic signs and extra poses
        thumb_out = thumb_tip['x'] > hand[5]['x'] + 0.05
        all_up = index_up and middle_up and ring_up and pinky_up and thumb_out

        if all_up:
            return self._evaluate_hold("Palm Open (Hello)", {
                "transcription": "Hello!",
                "command": "append",
                "text": "Hello ",
                "confidence": 0.98
            }, current_time)

        if index_up and middle_up and ring_up and not pinky_up and thumb_tip['y'] > hand[13]['y']:
            return self._evaluate_hold("W Sign (WhatsApp)", {
                "transcription": "W Sign caught (Launching WhatsApp)",
                "command": "launch",
                "app_name": "whatsapp",
                "confidence": 0.95
            }, current_time)

        if thumb_tip['y'] < hand[5]['y'] - 0.05 and index_tip['y'] > hand[5]['y']:
            return self._evaluate_hold("Thumbs Up", {"transcription": "Thumbs Up! (Message Sent)", "command": "send_message", "confidence": 0.95}, current_time)

        if thumb_tip['y'] > hand[5]['y'] + 0.05 and index_tip['y'] < hand[5]['y'] and middle_tip['y'] < hand[9]['y']:
            return self._evaluate_hold("Thumbs Down", {"transcription": "Thumbs down detected", "command": "append", "text": "Cancel ", "confidence": 0.92}, current_time)

        if pinky_tip['y'] < hand[17]['y'] - 0.05 and index_tip['y'] > hand[5]['y'] and middle_tip['y'] > hand[9]['y']:
            return self._evaluate_hold("Pinky Up", {"transcription": "Pinky Up! (Cleared Text)", "command": "clear_message", "confidence": 0.95}, current_time)

        if (index_tip['y'] < wrist['y'] - 0.2 and middle_tip['y'] < wrist['y'] - 0.2 and pinky_tip['y'] > hand[17]['y']):
            return self._evaluate_hold("App Launcher (Two Fingers)", {
                "transcription": "Two Fingers Up! (Launching YouTube)",
                "command": "launch",
                "app_name": "youtube",
                "confidence": 0.92
            }, current_time)

        # Extra recognizable poses
        if index_up and not middle_up and not ring_up and not pinky_up and thumb_tip['y'] < hand[5]['y']:
            return self._evaluate_hold("Peace Sign", {"transcription": "Peace sign detected", "command": "append", "text": "Peace ", "confidence": 0.94}, current_time)

        if not index_up and middle_up and ring_up and pinky_up and thumb_tip['y'] < hand[5]['y']:
            return self._evaluate_hold("Rock On", {"transcription": "Rock on detected", "command": "append", "text": "Rock on ", "confidence": 0.94}, current_time)

        if index_up and middle_up and not ring_up and not pinky_up and thumb_tip['y'] > hand[5]['y']:
            return self._evaluate_hold("Victory Sign", {"transcription": "Victory sign detected", "command": "append", "text": "Victory ", "confidence": 0.94}, current_time)

        if index_up and middle_up and ring_up and pinky_up and thumb_tip['y'] > hand[5]['y'] + 0.05:
            return self._evaluate_hold("Open Hand", {"transcription": "Open hand detected", "command": "append", "text": "Open ", "confidence": 0.9}, current_time)

        if index_up and not middle_up and ring_up and pinky_up and thumb_tip['y'] < hand[5]['y']:
            return self._evaluate_hold("Pointing Hand", {"transcription": "Pointing hand detected", "command": "append", "text": "Point ", "confidence": 0.9}, current_time)

        if index_up and middle_up and ring_up and pinky_up and thumb_tip['y'] < hand[5]['y'] - 0.05:
            return self._evaluate_hold("Okay Sign", {"transcription": "Okay sign detected", "command": "append", "text": "Okay ", "confidence": 0.9}, current_time)

        asl = detect_asl_letter(hand)
        if asl:
            return self._evaluate_hold(f"ASL: {asl}", {"transcription": f"Sign: {asl}", "command": "append", "text": asl}, current_time)

        self.current_holding_intent = None
        return {"status": "idle", "pose": "Active Tracking", "transcription": "Tracking Active", "confidence": 0.5, "progress": 0}
