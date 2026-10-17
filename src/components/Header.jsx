import React, { useEffect, useState } from 'react';
import { Sun, Moon, Shield, RefreshCw, UserCheck, ChevronDown, Activity, Users, ShieldAlert } from 'lucide-react';
import { getUsers } from '../api';

export default function Header({ 
  currentRole, 
  onRoleChange, 
  currentUser, 
  onUserChange, 
  theme, 
  onToggleTheme, 
  onResetDemo, 
  isResetting 
}) {
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch accounts based on active role view
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const users = await getUsers(currentRole);
        if (isMounted) {
          setUserList(users || []);
          // Auto-select first account if current user is not in list or role changed
          if (users && users.length > 0) {
            const match = users.find(u => u.id === currentUser?.id);
            if (!match) {
              onUserChange(users[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user accounts for role", currentRole, err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    fetchUsers();
    return () => { isMounted = false; };
  }, [currentRole]);

  return (
    <header className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D9A441]/10 dark:bg-[#D9A441]/10 light:bg-[#1F3A5F]/10 border border-[#D9A441]/40 dark:border-[#D9A441]/40 light:border-[#1F3A5F]/40 rounded-[2px]">
              <Shield className="w-5 h-5 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] uppercase font-mono">
                  SHIELD
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-widest bg-[#4A6572]/20 dark:bg-[#4A6572]/20 light:bg-[#8C8574]/20 border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] uppercase">
                  v0.1-PROTOTYPE
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] uppercase font-medium">
                Personnel Welfare Early-Warning System
              </p>
            </div>
          </div>

          {/* Quick theme toggle for mobile */}
          <button
            onClick={onToggleTheme}
            className="md:hidden p-2 text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D9A441]" /> : <Moon className="w-4 h-4 text-[#1F3A5F]" />}
          </button>
        </div>

        {/* Center: Role Switcher Tabs */}
        <div className="flex items-center bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-1 rounded-[2px]">
          <button
            onClick={() => onRoleChange('PERSONNEL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-semibold transition-all rounded-[2px] ${
              currentRole === 'PERSONNEL'
                ? 'bg-[#12161C] dark:bg-[#12161C] light:bg-white text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] shadow-sm'
                : 'text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Personnel</span>
          </button>

          <button
            onClick={() => onRoleChange('WELFARE_OFFICER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-semibold transition-all rounded-[2px] ${
              currentRole === 'WELFARE_OFFICER'
                ? 'bg-[#12161C] dark:bg-[#12161C] light:bg-white text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] shadow-sm'
                : 'text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Welfare Officer</span>
          </button>

          <button
            onClick={() => onRoleChange('COMMANDER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-semibold transition-all rounded-[2px] ${
              currentRole === 'COMMANDER'
                ? 'bg-[#12161C] dark:bg-[#12161C] light:bg-white text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] shadow-sm'
                : 'text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Commander</span>
          </button>
        </div>

        {/* Right: Account Switcher + Utilities */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Account Selector */}
          <div className="relative flex items-center">
            <div className="absolute left-2.5 pointer-events-none text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
              <Users className="w-3.5 h-3.5" />
            </div>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const found = userList.find(u => u.id === e.target.value);
                if (found) onUserChange(found);
              }}
              disabled={loadingUsers || userList.length === 0}
              className="appearance-none bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pl-8 pr-8 py-1.5 text-xs font-mono rounded-[2px] focus:outline-none focus:border-[#D9A441] dark:focus:border-[#D9A441] light:focus:border-[#1F3A5F] cursor-pointer"
            >
              {loadingUsers ? (
                <option value="">Loading accounts...</option>
              ) : userList.length === 0 ? (
                <option value="">No accounts found</option>
              ) : (
                userList.map((u) => (
                  <option key={u.id} value={u.id}>
                    [{u.service_number}] {u.full_name} ({u.unit_id}/{u.sub_unit_id})
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-2 pointer-events-none text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-semibold border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white hover:bg-[#1E2630] dark:hover:bg-[#1E2630] light:hover:bg-[#EAE7DF] text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21] transition-colors rounded-[2px]"
            title="Reset Synthetic Demo Dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#D9A441]' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Theme Toggle (Desktop) */}
          <button
            onClick={onToggleTheme}
            className="hidden md:flex p-2 text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] light:hover:text-[#1A1D21] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white rounded-[2px] transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D9A441]" /> : <Moon className="w-4 h-4 text-[#1F3A5F]" />}
          </button>

        </div>
      </div>
    </header>
  );
}
