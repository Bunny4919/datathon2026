import React from 'react';
import { UserSession } from '../../services/auth';
import { BadgeCheck } from 'lucide-react';

interface TopBarProps {
  user: UserSession;
}

const TopBar = ({ user }: TopBarProps) => {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between z-10 shrink-0 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-slate-600 font-semibold tracking-wide">
          Karnataka State Police Crime Analytics Hub
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200/80 text-[#7C3AED] rounded-full text-xs font-bold shadow-xs">
          <BadgeCheck size={14} className="stroke-[2.5]" />
          {user.role} Authorization
        </span>

        {/* User Info */}
        <div className="flex items-center gap-2.5 border-l border-slate-200/80 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/20">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-tight">{user.username}</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
