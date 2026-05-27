import WebcamView from '../WebcamView';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

type Command = 'append' | 'clear_message' | 'send_message';

type EngineState = {
  status: string;
  pose: string;
  progress: number;
  confidence: number;
};

interface Props {
  setIsProcessing: (status: boolean) => void;
  setTranscription: (text: string) => void;
  handleCommand: (cmd: Command, payload?: string) => void;
  targetLanguage: string;
  engineState: EngineState;
  isProcessing: boolean;
  setEngineState: (state: EngineState) => void;
}

export const CameraStage = ({ setIsProcessing, setTranscription, handleCommand, targetLanguage, engineState, isProcessing, setEngineState }: Props) => {
  return (
    <div className="relative aspect-video w-full h-full bg-black rounded-lg overflow-hidden group">
      <WebcamView
        onProcessingChange={setIsProcessing}
        onPrediction={setTranscription}
        onCommand={handleCommand}
        targetLanguage={targetLanguage}
        onEngineState={setEngineState}
      />

      {/* Status Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border shadow-lg text-[10px] font-bold uppercase tracking-widest ${isProcessing ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'}`}>
          <span className="relative flex h-2 w-2">
            {isProcessing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isProcessing ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          {isProcessing ? 'Lens Connected' : 'Video Paused'}
        </div>
      </div>

      {/* Detection Indicators */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        {engineState.status === 'holding' && (
          <div className="flex flex-col items-center bg-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl">
            <div className="relative w-20 h-20 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                <motion.circle
                  cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent"
                  className="text-blue-500"
                  initial={{ strokeDasharray: 226, strokeDashoffset: 226 }}
                  animate={{ strokeDashoffset: 226 - (226 * engineState.progress) }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {Math.round(engineState.progress * 100)}%
              </div>
            </div>
            <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{engineState.pose}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Hold to Confirm</p>
          </div>
        )}

        {engineState.status === 'listening' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="px-6 py-2 bg-blue-600/90 border border-blue-400 rounded-full shadow-lg"
          >
            <p className="text-xs font-bold text-white uppercase tracking-wider">Detected: {engineState.pose}</p>
          </motion.div>
        )}

        {engineState.status === 'conflict' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-600 px-3 py-1.5 rounded-md shadow-xl border border-rose-400">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Failsafe: {engineState.pose}</span>
          </div>
        )}
      </div>
    </div>
  )
}
