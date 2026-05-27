import { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout/Layout';
import { CameraStage } from './components/Dashboard/CameraStage';
import { OutputPanel } from './components/Dashboard/OutputPanel';
import { MessagingModule } from './components/Modules/MessagingModule';
import { GestureControlPanel } from './components/Modules/GestureControlPanel';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("System ready. Sign to begin...");
  const [engineState, setEngineState] = useState({ status: 'idle', pose: 'Tracking Active', progress: 0, confidence: 0 });
  const [messageDraft, setMessageDraft] = useState("");
  const [chatHistory, setChatHistory] = useState<{ text: string, time: string }[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("en");

  const draftRef = useRef("");
  useEffect(() => { draftRef.current = messageDraft; }, [messageDraft]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage === 'hi' ? 'hi-IN' : targetLanguage === 'es' ? 'es-ES' : targetLanguage === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = (cmd: 'append' | 'clear_message' | 'send_message', payload?: string) => {
    if (cmd === "append" && payload) {
      setMessageDraft(prev => prev + payload);
    } else if (cmd === "clear_message") {
      setMessageDraft("");
    } else if (cmd === "send_message") {
      const currentDraft = draftRef.current.trim();
      if (currentDraft !== "") {
        setChatHistory(prev => [...prev, { text: currentDraft, time: new Date().toLocaleTimeString() }]);
        setMessageDraft("");
        speak(currentDraft);
      }
    }
  };

  return (
    <Layout language={targetLanguage} setLanguage={setTargetLanguage}>
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Workspace - Left/Center */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <section className="card flex-1 min-h-[400px] relative overflow-hidden flex items-center justify-center">
            <CameraStage
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              setTranscription={setTranscription}
              handleCommand={handleCommand}
              targetLanguage={targetLanguage}
              engineState={engineState}
              setEngineState={setEngineState}
            />
          </section>

          <section className="card h-1/4 min-h-[150px]">
            <OutputPanel transcription={transcription} engineState={engineState} />
          </section>
        </div>

        {/* Messaging & Tools - Right Sidebar */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 ">
          <section className="card flex-1 flex flex-col overflow-hidden">
            <MessagingModule chatHistory={chatHistory} messageDraft={messageDraft} />
          </section>
          
          <section className="card">
            <GestureControlPanel />
          </section>
        </aside>

      </main>

      {/* Status Bar */}
      <footer className="h-12 border-t border-slate-700 bg-slate-900 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {isProcessing ? 'System Active' : 'System Paused'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">FPS: 30</span>
        </div>
        <div className="font-mono text-blue-400">
          Silentlink Engine v1.0.0
        </div>
      </footer>
    </Layout>
  );
}

export default App;
