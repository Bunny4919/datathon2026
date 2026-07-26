import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, UserSession } from '../../services/auth';
import { 
  MessageSquare, 
  BarChart2, 
  Share2, 
  Users, 
  TrendingUp, 
  FileText, 
  CreditCard, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  user: UserSession;
}

const Sidebar = ({ user }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Intelligence Chat', icon: MessageSquare },
    { path: '/analytics', label: 'Crime Analytics', icon: BarChart2 },
    { path: '/network', label: 'Criminal Networks', icon: Share2 },
    { path: '/profiles', label: 'Offender Profiles', icon: Users },
    { path: '/financials', label: 'Financial Trails', icon: CreditCard },
    { path: '/forecast', label: 'Trends & Alerts', icon: TrendingUp },
    { path: '/decision-support', label: 'Decision Support', icon: FileText },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 z-20 shadow-sm">
      {/* Brand Section */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white shadow-md shadow-purple-500/30">
          <ShieldCheck size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-900 leading-tight tracking-tight text-base">
            KSP <span className="text-[#7C3AED]">Intelligence</span>
          </h1>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
            Crime Analytics
          </span>
        </div>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold shadow-lg shadow-purple-500/25' 
                    : 'text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED] font-medium'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Section / Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/20">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
            <p className="text-[10px] text-[#7C3AED] font-extrabold tracking-wider uppercase">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100/80 active:bg-red-200 text-red-600 border border-red-200/80 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
