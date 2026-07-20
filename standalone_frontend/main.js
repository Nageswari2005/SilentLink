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
const apiStatePill = document.getElementById('apiStatePill');
const apiStateText = document.getElementById('apiStateText');
const backendSummary = document.getElementById('backendSummary');
const engineStateEl = document.getElementById('engineState');
const latencyValueEl = document.getElementById('latencyValue');
const apiHealthValueEl = document.getElementById('apiHealthValue');
const lastActionValueEl = document.getElementById('lastActionValue');
const languageSelect = document.getElementById('languageSelect');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const connectApiBtn = document.getElementById('connectApiBtn');
const sendBtn = document.getElementById('sendBtn');
const gestureLabelEl = document.getElementById('gestureLabel');
const gestureStatusTextEl = document.getElementById('gestureStatusText');
const gestureFeedEl = document.getElementById('gestureFeed');
const historyListEl = document.getElementById('historyList');
const ttsPreviewEl = document.getElementById('ttsPreview');
const ttsToggleBtn = document.getElementById('ttsToggleBtn');
const callActionBtn = document.getElementById('callActionBtn');
const ttsButtons = document.querySelectorAll('.chip-btn');
const gestureCountEl = document.getElementById('gestureCount');
const accuracyCardEl = document.getElementById('accuracyCard');
const accuracyTrendEl = document.getElementById('accuracyTrend');
const backendStatusCardEl = document.getElementById('backendStatusCard');
const backendStatusDetailEl = document.getElementById('backendStatusDetail');
const fpsCardEl = document.getElementById('fpsCard');
const historyCountEl = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const typingIndicator = document.getElementById('typingIndicator');
const messageCounter = document.getElementById('messageCounter');
const settingsStateEl = document.getElementById('settingsState');
const settingInputs = document.querySelectorAll('.setting-item input');
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sessionDurationEl = document.getElementById('sessionDuration');
const totalGesturesEl = document.getElementById('totalGestures');
const modelVersionEl = document.getElementById('modelVersion');
const modelStatusDetailEl = document.getElementById('modelStatusDetail');

let handLandmarker;
let runningMode = "VIDEO";
let lastVideoTime = -1;
let ws = null;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let apiBaseUrl = "http://127.0.0.1:8000";
let backendProbe = null;
let lastBackendLatency = null;
let ttsEnabled = true;
let gestureCount = 0;
let lastGestureKey = '';
let lastGestureAt = 0;
const preferencesKey = 'silentlink-preferences';
const historyKey = 'silentlink-history-v1';
const chatKey = 'silentlink-chat-v1';
const totalGesturesKey = 'silentlink-total-gestures';
const sessionStartedAt = Date.now();

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
            <p style="color: #94a3b8; max-width: 400px; line-height: 1.6;">SilentLink works best as a single command center. Close the other tab to continue.</p>
            <button onclick="location.reload()" style="margin-top: 32px; padding: 12px 24px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Check Again</button>
        </div>
    `;
    lucide.createIcons();
}

function normalizeBaseUrl(raw) {
    return (raw || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
}

function setBackendState(online, text, detail = '') {
    apiStatePill.classList.toggle('online', online);
    apiStatePill.classList.toggle('offline', !online);
    apiStateText.textContent = text;
    if (backendSummary && detail) {
        backendSummary.textContent = detail;
    }
    backendStatusCardEl.textContent = online ? 'Online' : text;
    backendStatusDetailEl.textContent = detail || (online ? 'Services reachable' : 'Awaiting connection');
}

function updateMetrics(label, value) {
    if (label === 'engine') engineStateEl.textContent = value;
    if (label === 'latency') latencyValueEl.textContent = value;
    if (label === 'health') apiHealthValueEl.textContent = value;
    if (label === 'action') lastActionValueEl.textContent = value;
}

function updateGestureFeed(label, detail) {
    const row = document.createElement('div');
    row.className = 'gesture-row';
    row.innerHTML = `<span class="gesture-name">${label}</span><span class="gesture-value">${detail}</span>`;
    gestureFeedEl.prepend(row);
    if (gestureFeedEl.children.length > 4) {
        gestureFeedEl.removeChild(gestureFeedEl.lastChild);
    }
}

function addHistoryItem(text, tone = 'neutral') {
    const entries = JSON.parse(localStorage.getItem(historyKey) || '[]');
    entries.unshift({ text, tone, timestamp: Date.now() });
    localStorage.setItem(historyKey, JSON.stringify(entries.slice(0, 100)));
    const item = document.createElement('li');
    item.className = `history-item ${tone === 'muted' ? 'muted' : ''}`;
    item.textContent = `${new Date().toLocaleString()} — ${text}`;
    historyListEl.prepend(item);
    while (historyListEl.children.length > 6) {
        historyListEl.removeChild(historyListEl.lastChild);
    }
    historyCountEl.textContent = `${historyListEl.children.length} ${historyListEl.children.length === 1 ? 'item' : 'items'}`;
}

function updateAccuracy(value) {
    const percentage = Math.round(value * 100);
    confidenceEl.textContent = `Confidence: ${percentage}%`;
    accuracyCardEl.textContent = `${percentage}%`;
    accuracyTrendEl.textContent = percentage >= 80 ? 'Strong detection' : percentage >= 50 ? 'Improving signal' : 'Low-confidence reading';
}

function registerGesture(label, confidence) {
    const now = Date.now();
    const key = `${label}-${Math.round(confidence * 100)}`;
    if (key !== lastGestureKey || now - lastGestureAt > 1100) {
        gestureCount += 1;
        gestureCountEl.textContent = gestureCount;
        const total = Number(localStorage.getItem(totalGesturesKey) || 0) + 1;
        localStorage.setItem(totalGesturesKey, String(total));
        totalGesturesEl.textContent = total;
        document.getElementById('gestureCountTrend').textContent = `Last: ${label}`;
        lastGestureKey = key;
        lastGestureAt = now;
    }
}

function addAssistantMessage(text) {
    saveChatMessage(text, 'assistant');
    const wrapper = document.createElement('div');
    wrapper.className = 'message-bubble message-bubble--assistant';
    const card = document.createElement('div');
    card.className = 'message-card';
    card.textContent = `${text}\n${new Date().toLocaleString()}`;
    wrapper.appendChild(card);
    chatHistory.appendChild(wrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function saveChatMessage(text, role) {
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    messages.push({ text, role, timestamp: Date.now() });
    localStorage.setItem(chatKey, JSON.stringify(messages.slice(-50)));
}

function restoreSavedActivity() {
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    if (history.length) {
        historyListEl.replaceChildren();
        history.slice(0, 6).reverse().forEach(({ text, tone, timestamp }) => {
            const item = document.createElement('li');
            item.className = `history-item ${tone === 'muted' ? 'muted' : ''}`;
            item.textContent = `${new Date(timestamp).toLocaleString()} — ${text}`;
            historyListEl.prepend(item);
        });
        historyCountEl.textContent = `${history.length} ${history.length === 1 ? 'item' : 'items'}`;
    }
    const messages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    if (messages.length) {
        chatHistory.replaceChildren();
        messages.forEach(({ text, role, timestamp }) => {
            const wrapper = document.createElement('div');
            wrapper.className = `message-bubble message-bubble--${role}`;
            const card = document.createElement('div');
            card.className = 'message-card';
            card.textContent = `${text}\n${new Date(timestamp).toLocaleString()}`;
            wrapper.appendChild(card);
            chatHistory.appendChild(wrapper);
        });
    }
}

function updateSessionDuration() {
    const seconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
    sessionDurationEl.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function savePreferences() {
    const preferences = Object.fromEntries([...settingInputs].map((input) => [input.id, input.checked]));
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    settingsStateEl.textContent = 'Saved';
    addHistoryItem('Preferences updated');
}

function restorePreferences() {
    try {
        const preferences = JSON.parse(localStorage.getItem(preferencesKey) || '{}');
        settingInputs.forEach((input) => { if (typeof preferences[input.id] === 'boolean') input.checked = preferences[input.id]; });
    } catch { /* Use the markup defaults when local storage is unavailable. */ }
}

function bindEvents() {
    languageSelect.addEventListener('change', async (event) => {
        const selected = event.target.value;
        updateMetrics('action', `Voice ${selected}`);
        await postToBackend('/api/voice', { target_lang: selected, voice: selected });
    });

    connectApiBtn.addEventListener('click', () => connectBackend(true));
    sendBtn.addEventListener('click', sendManualMessage);
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendManualMessage();
        }
    });
    messageInput.addEventListener('input', () => {
        messageCounter.textContent = `${messageInput.value.length} / 160`;
    });
    clearHistoryBtn.addEventListener('click', () => {
        historyListEl.innerHTML = '';
        addHistoryItem('History cleared', 'muted');
    });
    settingInputs.forEach((input) => input.addEventListener('change', savePreferences));
    navItems.forEach((item) => item.addEventListener('click', () => {
        navItems.forEach((navItem) => navItem.classList.toggle('active', navItem === item));
        const target = document.getElementById(item.dataset.section);
        target?.scrollIntoView({ behavior: 'smooth', block: item.dataset.section === 'dashboard' ? 'start' : 'center' });
        if (item.dataset.section === 'messages') messageInput.focus({ preventScroll: true });
    }));

    ttsButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'play') {
                const text = messageInput.value.trim() || 'Speech synthesis ready.';
                speak(text);
                ttsPreviewEl.textContent = text;
            } else if (action === 'pause') {
                window.speechSynthesis.pause();
                ttsPreviewEl.textContent = 'Speech paused.';
            } else if (action === 'stop') {
                window.speechSynthesis.cancel();
                ttsPreviewEl.textContent = 'Speech stopped.';
            }
        });
    });

    ttsToggleBtn.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        ttsToggleBtn.classList.toggle('active', ttsEnabled);
        ttsPreviewEl.textContent = ttsEnabled ? 'Voice output enabled.' : 'Voice output muted.';
    });

    callActionBtn.addEventListener('click', () => {
        callActionBtn.classList.toggle('active');
        addHistoryItem('Call action triggered');
        updateMetrics('action', 'Call initiated');
    });
}

async function connectBackend(forceReconnect = false) {
    const targetUrl = normalizeBaseUrl(apiBaseUrlInput.value || apiBaseUrl);
    apiBaseUrl = targetUrl;
    apiBaseUrlInput.value = targetUrl;
    setBackendState(false, 'Connecting...', `Probing ${targetUrl}`);
    updateMetrics('health', 'Checking');
    updateMetrics('action', 'Connecting');

    try {
        const probe = await probeBackend(targetUrl);
        backendProbe = probe;
        if (probe) {
            const detail = probe.data?.message || probe.data?.status || `REST reachable via ${probe.endpoint}`;
            setBackendState(true, 'Connected', detail);
            updateMetrics('health', 'Reachable');
            updateMetrics('action', 'Backend ready');
        } else {
            setBackendState(false, 'Offline', 'No REST health endpoint was reachable. WebSocket is still available if the server is running.');
            updateMetrics('health', 'Offline');
        }
        connectWebSocket(targetUrl, forceReconnect);
        await postToBackend('/api/voice', { target_lang: languageSelect.value, voice: languageSelect.value });
    } catch (error) {
        console.error('Backend connection error:', error);
        setBackendState(false, 'Connection Failed', error.message || 'Unable to reach backend API.');
        updateMetrics('health', 'Failed');
    }
}

async function probeBackend(baseUrl) {
    const endpoints = [`${baseUrl}/health`, `${baseUrl}/api/health`, `${baseUrl}/status`];
    for (const endpoint of endpoints) {
        const start = performance.now();
        try {
            const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
            if (!response.ok) {
                continue;
            }
            const data = await response.json().catch(() => ({}));
            lastBackendLatency = Math.round(performance.now() - start);
            updateMetrics('latency', `${lastBackendLatency} ms`);
            return { endpoint, data };
        } catch {
            continue;
        }
    }
    return null;
}

async function postToBackend(path, payload) {
    const url = `${apiBaseUrl}${path}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch {
        return false;
    }
}

function connectWebSocket(baseUrl, forceReconnect = false) {
    if (ws && ws.readyState === WebSocket.OPEN && !forceReconnect) {
        return;
    }

    if (ws) {
        ws.close();
    }

    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/landmarks';
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to backend WebSocket');
        statusBadge.classList.replace('offline', 'online');
        statusText.textContent = 'Sensor Active';
        setBackendState(true, 'Connected', `Socket available at ${wsUrl}`);
        updateMetrics('action', 'Live stream');
    };

    ws.onmessage = (event) => {
        try {
            const result = JSON.parse(event.data);
            handleBackendUpdate(result);
        } catch (error) {
            console.error('Invalid backend payload:', error);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Retrying...');
        statusBadge.classList.replace('online', 'offline');
        statusText.textContent = 'Sensor Offline';
        setBackendState(false, 'Retrying', 'Reconnecting to backend services...');
        setTimeout(() => connectWebSocket(baseUrl), 2000);
    };

    ws.onerror = (err) => {
        console.error('WS Error:', err);
    };
}

function handleBackendUpdate(result) {
    if (result.transcription) {
        transcriptionEl.textContent = result.transcription;
    }

    if (result.confidence !== undefined) {
        updateAccuracy(result.confidence);
    }

    if (result.pose || result.gesture) {
        const label = result.pose || result.gesture || 'Gesture';
        gestureLabelEl.textContent = label;
        gestureStatusTextEl.textContent = label;
        updateGestureFeed(label, `${Math.round((result.confidence || 0) * 100)}%`);
        registerGesture(label, result.confidence || 0);
    }

    if (result.status === 'holding') {
        holdOverlay.classList.remove('hidden');
        const progress = result.progress || 0;
        const offset = 314 - (314 * progress);
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${Math.round(progress * 100)}%`;
        poseLabel.textContent = result.pose || 'Hold to Confirm';
    } else {
        holdOverlay.classList.add('hidden');
    }

    if (result.command === 'append' && result.text) {
        messageInput.value += result.text;
    } else if (result.command === 'clear_message') {
        messageInput.value = '';
        messageCounter.textContent = '0 / 160';
    } else if (result.command === 'send_message') {
        const text = messageInput.value.trim();
        if (text) {
            addMessageToChat(text);
            messageInput.value = '';
            messageCounter.textContent = '0 / 160';
            speak(text);
        }
    }

    if (result.backend_status) {
        const state = result.backend_status === 'ok' ? 'Connected' : 'Pending';
        setBackendState(result.backend_status === 'ok', state, result.message || 'Ping received from backend.');
    }

    if (result.metrics) {
        if (result.metrics.engine) updateMetrics('engine', result.metrics.engine);
        if (result.metrics.latency) updateMetrics('latency', `${result.metrics.latency} ms`);
        if (result.metrics.health) updateMetrics('health', result.metrics.health);
    }
}

function addMessageToChat(text) {
    saveChatMessage(text, 'user');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-bubble message-bubble--user';
    const card = document.createElement('div');
    card.className = 'message-card';
    card.textContent = `${text}\n${new Date().toLocaleString()}`;
    msgDiv.appendChild(card);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    addHistoryItem(text, 'neutral');
    updateMetrics('action', 'Message sent');
    if (document.getElementById('autoReplySetting').checked) {
        typingIndicator.classList.remove('hidden');
        window.setTimeout(() => {
            typingIndicator.classList.add('hidden');
            addAssistantMessage('Message delivered. I’m ready for your next gesture.');
        }, 750);
    }
}

function speak(text) {
    if (!ttsEnabled) {
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.01;
    window.speechSynthesis.speak(utterance);
    ttsPreviewEl.textContent = text;
}

function sendManualMessage() {
    const text = messageInput.value.trim();
    if (!text) {
        return;
    }
    addMessageToChat(text);
    messageInput.value = '';
    messageCounter.textContent = '0 / 160';
    speak(text);
    postToBackend('/api/command', { command: 'send_message', text });
}

async function createHandLandmarker() {
    console.log('Starting MediaPipe initialization...');
    try {
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                delegate: 'GPU'
            },
            runningMode: runningMode,
            numHands: 2
        });
        updateMetrics('engine', 'Ready');
        modelVersionEl.textContent = '0.10.x';
        modelStatusDetailEl.textContent = 'Hand Landmarker ready';
        startWebcam();
    } catch (err) {
        console.error('CRITICAL: MediaPipe Init Error:', err);
        statusText.textContent = 'Engine Load Failed';
        updateMetrics('engine', 'Failed');
        modelStatusDetailEl.textContent = 'Model failed to load';
    }
}

async function startWebcam() {
    console.log('Requesting webcam access...');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 }
        });
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
            console.log('Video data loaded. Starting prediction loop...');
            predictWebcam();
        });
    } catch (err) {
        console.error('Webcam Error:', err);
        statusText.textContent = 'Camera Blocked';
        updateMetrics('engine', 'Camera blocked');
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
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    landmarks: results.landmarks,
                    target_lang: languageSelect.value || 'en'
                }));
            }

            for (const landmarks of results.landmarks) {
                for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = '#60a5fa';
                    ctx.fill();
                }
            }
        }

        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate > 1000) {
            fpsEl.textContent = `FPS: ${frameCount}`;
            fpsCardEl.textContent = frameCount;
            frameCount = 0;
            lastFpsUpdate = now;
        }
    }

    requestAnimationFrame(predictWebcam);
}

restorePreferences();
bindEvents();
restoreSavedActivity();
totalGesturesEl.textContent = localStorage.getItem(totalGesturesKey) || '0';
updateSessionDuration();
window.setInterval(updateSessionDuration, 1000);
if (!chatHistory.children.length) addAssistantMessage('Welcome back. Your command center is ready.');
tabChannel.postMessage('ping');
setTimeout(() => {
    if (isMainTab) {
        createHandLandmarker();
        connectBackend();
    }
}, 500);
