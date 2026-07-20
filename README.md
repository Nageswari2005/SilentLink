# Silentlink

SilentLink is an AI-powered Sign Language Translation and Gesture Control System that enables users to control a computer using hand gestures. Built with FastAPI, OpenCV, MediaPipe, and a standalone web dashboard, it translates gestures into actions and text in real time.

---

## Why Silentlink?

SilentLink was developed to address the communication and accessibility challenges faced by individuals with hearing and speech impairments. The project leverages Artificial Intelligence, Computer Vision, and Hand Gesture Recognition to enable intuitive, touch-free interaction between users and computers.

By translating hand gestures into system commands and meaningful text in real time, SilentLink reduces dependence on traditional input devices such as keyboards and mice. Its goal is to provide an accessible, efficient, and user-friendly interface while demonstrating the practical application of AI in creating inclusive and assistive technologies.

Beyond accessibility, SilentLink showcases the integration of modern technologies including FastAPI, OpenCV, MediaPipe, WebSockets, and real-time processing to build a scalable and interactive gesture-based communication system.

---

## ✨ Core Features

- Real-time hand gesture recognition
- Sign language translation
- Cursor movement and click control
- Scroll and drag using gestures
- Launch desktop applications using gestures
- Live dashboard with analytics
- User login interface
- Messaging and gesture history
- Multi-language translation support
- FastAPI backend with WebSocket communication

---

## 🧠 How It Works

1. The webcam captures live video.
2. MediaPipe detects hand landmarks.
3. Gesture data is sent to the FastAPI backend through WebSockets.
4. The Gesture Engine identifies the gesture.
5. The backend executes the corresponding system action.
6. Results are displayed instantly on the dashboard.

This makes the app feel responsive, modular, and easy to extend as more gestures are added.

---

## 🛠️ Tech Stack

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6), WebSocket API |
| **Backend** | Python 3, FastAPI, Uvicorn, WebSockets |
| **Computer Vision** | OpenCV, MediaPipe, NumPy |
| **System Automation** | PyAutoGUI, PyGetWindow, PyWin32 |
| **Translation & Speech** | Deep Translator, gTTS, Web Speech API |
| **Data Storage** | Browser Local Storage, JSON |
| **Development Tools** | Visual Studio Code, Git, GitHub, Python Virtual Environment |
| **Communication** | REST APIs, WebSockets |

---

## 📁 Project Structure

```text

SilentLink/
│
├── backend/
│   ├── main.py
│   ├── gesture_engine.py
│   ├── cursor_controller.py
│   ├── app_launcher.py
│
├── standalone_frontend/
│   ├── index.html
│   ├── login.html
│   ├── main.js
│   └── style.css
│
├── README.md
├── Run-SilentLink.ps1
└── requirements.txt

```

---

## 🚀 Quick Start


### 1. Set up the Python backend

```powershell

git clone https://github.com/Nageswari2005/SilentLink.git
cd SilentLink
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python backend/main.py

```

### 3. Run the app

Option A — use the bundled launcher:

```powershell
powershell -ExecutionPolicy Bypass -File .\Run-Silentlink.ps1
```

Option B — manual start:

```powershell
cd frontend
npm run build

cd ..\backend
uvicorn main:app --reload --port 8000
```

Then open:

```text
http://localhost:8000
```

---

## 🎯 What You Can Do

- Use hand gestures to navigate and interact with your screen
- Launch apps with simple pose patterns
- Send commands through the live dashboard
- Explore gesture-driven messaging and control workflows

---

## 🔮 Future Improvements

- More gesture vocabulary and better ASL recognition
- Better accuracy with advanced hand-tracking models
- Voice + gesture hybrid control
- Multi-language command support
- Custom gesture profiles for different users

---

## License

This project is currently under active development.
