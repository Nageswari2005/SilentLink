import React from 'react';

type EngineState = {
  status: string;
  pose: string;
  progress: number;
  confidence: number;
};

interface Props {
  transcription: string;
  engineState: EngineState;
}

export const OutputPanel: React.FC<Props> = ({ transcription, engineState }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Transcription</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Confidence:</span>
          <span className="text-xs font-mono text-blue-400">{(engineState.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-[60px] flex items-center">
        <p className="text-2xl leading-relaxed text-blue-100 font-semibold italic">
          {transcription || "..."}
        </p>
      </div>

      <div className="mt-4 pt-2 border-t border-slate-700/50 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${engineState.confidence * 100}%` }}
          ></div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">SIGNAL</span>
      </div>
    </div>
  );
};
