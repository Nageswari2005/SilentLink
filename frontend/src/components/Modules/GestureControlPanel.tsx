import React from 'react';
import { MousePointer2 } from 'lucide-react';

export const GestureControlPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
        <MousePointer2 className="w-4 h-4 text-blue-500" /> System Modalities
      </h2>
      <div className="space-y-1 ">
        {[
          { label: 'ASL Alphabet', gesture: 'Standard' },
          { label: 'Scrolling', gesture: 'Index+Mid' },
          { label: 'System Action', gesture: 'Hold & Pinch' },
          { label: 'Messaging', gesture: 'Dynamic' },
        ].map((cmd, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 px-1 hover:bg-slate-800/50 rounded transition-colors group">
            <span className="text-xs text-slate-300 font-medium">{cmd.label}</span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 group-hover:border-blue-500/30">
              {cmd.gesture}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="text-[10px] text-slate-500 leading-tight">
          Ensure hands are clearly visible within the camera frame for optimal tracking.
        </div>
      </div>
    </div>
  );
};
