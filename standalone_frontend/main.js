import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.x";

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const transcriptionEl = document.getElementById('transcriptionText');
const confidenceEl = document.getElementById('confidenceInfo');
const messageInput = document.getElementById('messageInput');
const chatHistory = document.getElementById('chatHistory');
const statusBadge = document.getElementById('statusBadge');
const statusText = statusBadge.querySelector('.status-text');
const holdOverlay = document.getElementById('holdOverlay');
const progressCircle = document.getElementById('progressCircle');
const progressText = document.getElementById('progressText');
const poseLabel = document.getElementById('poseLabel');
const fpsEl = document.getElementById('fps');

let handLandmarker;
let runningMode = "VIDEO";
let lastVideoTime = -1;
let ws = null;
let frameCount = 0;
let lastFpsUpdate = performance.now();

// --- Single Tab Guard ---
const tabChannel = new BroadcastChannel('silentlink_tab_guard');
let isMainTab = true;

tabChannel.onmessage = (e) => {
    if (e.data === 'ping' && isMainTab) {
        tabChannel.postMessage('pong');
    } else if (e.data === 'pong') {
        isMainTab = false;
        showTabConflictOverlay();
    }
};

function showTabConflictOverlay() {
    document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; text-align: center; font-family: sans-serif;">
            <i data-lucide="alert-triangle" style="width: 64px; height: 64px; color: #ef4444; margin-bottom: 24px;"></i>
            <h1 style="font-size: 24px; margin-bottom: 12px;">Multiple Tabs Detected</h1>
            <p style="color: #94a3b8; max-width: 400px; line-height: 1.6;">Silentlink works best as a single command center. Please close this tab or the other one to continue.</p>
            <button onclick="location.reload()" style="margin-top: 32px; padding: 12px 24px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Check Again</button>
        </div>
    `;
    lucide.createIcons();
}

// Check for other tabs on init
tabChannel.postMessage('ping');
setTimeout(() => {
    if (isMainTab) {
        // Initial setup...
        createHandLandmarker();
        connectWebSocket();
    }
}, 500);
function connectWebSocket() {
    ws = new WebSocket('ws://127.0.0.1:8000/ws/landmarks');
    
    ws.onopen = () => {
        console.log("Connected to Backend");
        statusBadge.classList.replace('offline', 'online');
        statusText.textContent = "Sensor Active";
    };

    ws.onmessage = (event) => {
        const result = JSON.parse(event.data);
        handleBackendUpdate(result);
    };

    ws.onclose = () => {
        console.log("Disconnected from Backend. Retrying...");
        statusBadge.classList.replace('online', 'offline');
        statusText.textContent = "Sensor Offline";
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (err) => console.error("WS Error:", err);
}

function handleBackendUpdate(result) {
    if (result.transcription) {
        transcriptionEl.textContent = result.transcription;
    }
    
    if (result.confidence !== undefined) {
        confidenceEl.textContent = `Confidence: ${Math.round(result.confidence * 100)}%`;
    }

    // Engine State Overlays
    if (result.status === 'holding') {
        holdOverlay.classList.remove('hidden');
        const progress = result.progress || 0;
        const offset = 314 - (314 * progress);
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${Math.round(progress * 100)}%`;
        poseLabel.textContent = result.pose || "Hold to Confirm";
    } else {
        holdOverlay.classList.add('hidden');
    }

    // System Commands
    if (result.command === 'append' && result.text) {
        messageInput.value += result.text;
    } else if (result.command === 'clear_message') {
        messageInput.value = "";
    } else if (result.command === 'send_message') {
        const text = messageInput.value.trim();
        if (text) {
            addMessageToChat(text);
            messageInput.value = "";
            speak(text);
        }
    }
}

function addMessageToChat(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.textContent = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// --- MediaPipe Setup ---
async function createHandLandmarker() {
    console.log("Starting MediaPipe initialization...");
    try {
        console.log("Fetching FilesetResolver...");
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        console.log("FilesetResolver loaded. Creating HandLandmarker...");
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            numHands: 2
        });
        console.log("HandLandmarker created successfully.");
        startWebcam();
    } catch (err) {
        console.error("CRITICAL: MediaPipe Init Error:", err);
        statusText.textContent = "Engine Load Failed";
    }
}

async function startWebcam() {
    console.log("Requesting webcam access...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 } 
        });
        console.log("Webcam access granted.");
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            console.log("Video data loaded. Starting prediction loop...");
            predictWebcam();
        });
    } catch (err) {
        console.error("Webcam Error:", err);
        statusText.textContent = "Camera Blocked";
    }
}

async function predictWebcam() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.landmarks && results.landmarks.length > 0) {
            // Send to Backend
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    landmarks: results.landmarks,
                    target_lang: 'en'
                }));
            }

            // Draw Landmarks locally
            for (const landmarks of results.landmarks) {
                for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = "#3b82f6";
                    ctx.fill();
                }
            }
        }

        // FPS Calculation
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate > 1000) {
            fpsEl.textContent = `FPS: ${frameCount}`;
            frameCount = 0;
            lastFpsUpdate = now;
        }
    }

    requestAnimationFrame(predictWebcam);
}

// Initialize is now handled by the tab guard check logic above
