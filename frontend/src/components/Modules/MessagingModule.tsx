import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

type ChatMessage = { text: string; time: string };

interface Props {
  chatHistory: ChatMessage[];
  messageDraft: string;
}

export const MessagingModule: React.FC<Props> = ({ chatHistory, messageDraft }) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
        <MessageSquare className="w-4 h-4 text-blue-500" /> Messaging Composer
      </h2>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 flex flex-col">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-xs font-medium italic">Compose via ASL gestures...</p>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div
              key={i}
              className="self-end bg-blue-600/20 border border-blue-500/30 text-slate-100 rounded-lg p-3 text-sm relative max-w-[80%]"
            >
              {msg.text}
              <div className="text-[9px] text-blue-400 mt-1 text-right">{msg.time}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700 relative">
        <input
          type="text"
          value={messageDraft}
          readOnly
          placeholder="Awaiting entry..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <div className="absolute right-2 top-[calc(1rem+4px)] p-2 bg-blue-600 rounded-md shadow-md text-white">
          <Send className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
