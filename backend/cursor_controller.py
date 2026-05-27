import pyautogui
import collections

# Extremely important: moving the mouse to any corner crashes pyautogui intentionally to give you control back
pyautogui.FAILSAFE = True

class CursorController:
    def __init__(self):
        self.screen_width, self.screen_height = pyautogui.size()
        
        # Moving average for jitter reduction
        self.history_len = 5
        self.x_history = collections.deque(maxlen=self.history_len)
        self.y_history = collections.deque(maxlen=self.history_len)
        
        # State
        self.is_active = True
        self.is_dragging = False
        
    def update_cursor(self, norm_x, norm_y):
        if not self.is_active:
            return

        # Invert X since the camera is mirrored
        inv_x = 1.0 - norm_x
        inv_y = norm_y

        self.x_history.append(inv_x)
        self.y_history.append(inv_y)
        
        avg_x = sum(self.x_history) / len(self.x_history)
        avg_y = sum(self.y_history) / len(self.y_history)
        
        # Map to screen dimensions
        screen_x = int(avg_x * self.screen_width)
        screen_y = int(avg_y * self.screen_height)
        
        try:
            pyautogui.moveTo(screen_x, screen_y, duration=0.0)
        except pyautogui.FailSafeException:
            print("PyAutoGUI Failsafe triggered!")
            self.is_active = False
            self.is_dragging = False

    def click(self):
        if self.is_active:
            pyautogui.click()
            
    def mouse_down(self):
        if self.is_active and not self.is_dragging:
            pyautogui.mouseDown()
            self.is_dragging = True

    def mouse_up(self):
        if self.is_active and self.is_dragging:
            pyautogui.mouseUp()
            self.is_dragging = False

    def scroll(self, direction):
        # Direction: 1 for up, -1 for down
        if self.is_active:
            pyautogui.scroll(direction * 150)
            
    def toggle_active(self, state: bool):
        self.is_active = state
        if not state:
            self.x_history.clear()
            self.y_history.clear()
            if self.is_dragging:
                pyautogui.mouseUp()
                self.is_dragging = False
