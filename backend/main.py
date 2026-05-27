from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import json
from gesture_engine import GestureEngine
from app_launcher import AppLauncher

app = FastAPI(title="Silentlink API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gesture_engine = GestureEngine()
app_launcher = AppLauncher()

@app.websocket("/ws/landmarks")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to landmarks WebSocket")
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if isinstance(payload, list):
                landmarks_data = payload
                target_lang = "en"
            else:
                landmarks_data = payload.get("landmarks", [])
                target_lang = payload.get("target_lang", "en")
            
            # Process landmarks using the engine with translation
            result = gesture_engine.process(landmarks_data, target_lang)
            
            # Send back the detected gestures or commands
            await websocket.send_json(result)
            
            # Execute system commands
            if result.get("command") == "launch":
                app_name = result.get("app_name")
                if app_name:
                    app_launcher.launch(app_name)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

# Serve Frontend Static Files
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    @app.get("/{path_name:path}")
    async def catch_all(path_name: str):
        # Serve icons, svg etc from root if they exist
        file_path = os.path.join(frontend_path, path_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Default to index.html for SPA routing
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    print(f"Warning: Frontend build not found at {frontend_path}")
