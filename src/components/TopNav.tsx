import React from 'react';
import { 
  Search, 
  UploadCloud, 
  CheckSquare, 
  FolderArchive,
  FolderTree, 
  Database, 
  Lock, 
  Users, 
  LogOut, 
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { SystemSettings, UserAccount } from '../types/dms';
import { OraclimeLogo } from './OraclimeLogo';

interface TopNavProps {
  activeTab: 'dashboard' | 'import' | 'review' | 'existing_files' | 'explorer' | 'database' | 'users';
  setActiveTab: (tab: 'dashboard' | 'import' | 'review' | 'existing_files' | 'explorer' | 'database' | 'users') => void;
  settings: SystemSettings;
  currentUser: UserAccount;
  onLockSystem: () => void;
  onOpenQuickSearch: () => void;
  onOpenChangePin: () => void;
  onLogout: () => void;
  pendingReviewCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  settings,
  currentUser,
  onLockSystem,
  onOpenQuickSearch,
  onOpenChangePin,
  onLogout,
  pendingReviewCount,
}) => {
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'administrator';

  const navItems: Array<{
    id: 'dashboard' | 'import' | 'review' | 'existing_files' | 'explorer' | 'database' | 'users';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    adminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Search & Records',
      icon: <Search className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'import',
      label: 'Import PDFs',
      icon: <UploadCloud className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'review',
      label: 'OCR Review',
      icon: <CheckSquare className="w-3.5 h-3.5 shrink-0" />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    {
      id: 'existing_files',
      label: 'Existing Files',
      icon: <FolderArchive className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'explorer',
      label: 'Folder Explorer',
      icon: <FolderTree className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'database',
      label: 'Database & Backup',
      icon: <Database className="w-3.5 h-3.5 shrink-0" />,
      adminOnly: true,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-3.5 h-3.5 shrink-0" />,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Primary Top Bar */}
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-2">
        {/* Zone 1: ORACLIME Brand Logo & Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group cursor-pointer focus:outline-none transition-transform hover:scale-[1.01]"
            title="Return to Home Dashboard"
          >
            <div className="hidden 2xl:block">
              <OraclimeLogo size="md" showSubtitle={true} />
            </div>
            <div className="block 2xl:hidden">
              <OraclimeLogo size="sm" showSubtitle={false} />
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links (xl and above) */}
        <nav
          aria-label="Main Navigation"
          className="hidden xl:flex items-center justify-center gap-1 text-xs font-medium flex-1 min-w-0 overflow-x-auto py-0.5"
        >
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs border border-slate-700/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Profile, Quick Search & Security Actions (Always visible, never clipped) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenQuickSearch}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-md text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap font-mono cursor-pointer shrink-0"
            title="Search by Application Number (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden md:inline">App No.</span>
            <kbd className="hidden 2xl:inline-block px-1.5 py-0.2 bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* User Info Capsule */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-md border border-slate-800 text-xs font-mono shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="leading-tight text-left">
              <span className="text-white font-bold block truncate max-w-[85px] sm:max-w-[115px] 2xl:max-w-[150px]">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase block leading-none mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Change Security PIN Button */}
          <button
            onClick={onOpenChangePin}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Change Operator Security PIN"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Lock Screen Button */}
          <button
            onClick={onLockSystem}
            className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Lock Workstation (Ctrl+L)"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Logout Button — Prominently visible with icon + label across all pages */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-800/80 hover:border-rose-600 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Sign Out of ORACLIME DMS"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Responsive Navigation Strip for Laptop / Tablet / Mobile (< 1280px) */}
      <nav
        aria-label="Compact Navigation"
        className="flex xl:hidden items-center gap-1 px-3 sm:px-5 py-1.5 bg-slate-950/80 border-t border-slate-800/80 text-xs font-medium overflow-x-auto"
      >
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono rounded font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
