import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  language: string;
  setLanguage: (l: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, language, setLanguage }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      <Sidebar language={language} setLanguage={setLanguage} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Interface Command Center
          </h1>
        </header>
        <div className="flex-1 overflow-auto bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
