import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { Activity, Volume2, Home, MessageSquare, Settings } from 'lucide-react';

interface Props {
  language: string;
  setLanguage: (l: string) => void;
}

export const Sidebar: React.FC<Props> = ({ language, setLanguage }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col py-6">
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Silentlink</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <NavItem icon={<Home />} label="Dashboard" active />
        <NavItem icon={<MessageSquare />} label="Messages" />
        <NavItem icon={<Settings />} label="Settings" />
      </nav>

      <div className="px-4 mt-auto">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            <Volume2 className="w-3 h-3" /> Voice Output
          </div>
          <select
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English (US)</option>
            <option value="hi">Hindi (IN)</option>
            <option value="es">Spanish (ES)</option>
            <option value="fr">French (FR)</option>
          </select>
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: ReactElement<{ className?: string }>;
  label: string;
  active?: boolean;
}

const NavItem = ({ icon, label, active = false }: NavItemProps) => (
  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium ${active ? 'bg-blue-600/10 text-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
    {cloneElement(icon, { className: 'w-5 h-5' })}
    <span>{label}</span>
  </div>
);
