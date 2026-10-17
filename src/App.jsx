import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PersonnelView from './components/PersonnelView';
import WelfareOfficerView from './components/WelfareOfficerView';
import CommanderView from './components/CommanderView';
import { getHealth, seedDemo } from './api';
import { Shield, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState('PERSONNEL');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shield_theme') || 'dark';
  });

  // Demo seeding state
  const [isInitializing, setIsInitializing] = useState(true);
  const [initMessage, setInitMessage] = useState('Connecting to SHIELD Core API...');
  const [isResetting, setIsResetting] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Sync theme class on HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('shield_theme', theme);
  }, [theme]);

  // Initial load check: call GET /health, if seeded: false -> call POST /demo/seed
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      setIsInitializing(true);
      setBackendError(null);
      try {
        setInitMessage('Checking backend system status...');
        const health = await getHealth();
        
        if (!health.seeded) {
          setInitMessage('Setting up demo world... Generating synthetic baseline & training model...');
          await seedDemo();
        }
      } catch (err) {
        console.error("Backend initialization failed:", err);
        setBackendError(
          "Unable to connect to FastAPI backend at http://localhost:8000. Please ensure the Python server is running."
        );
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initApp();
    return () => { isMounted = false; };
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      await seedDemo();
      // Reload window or state to refresh all views
      window.location.reload();
    } catch (err) {
      console.error("Failed to reset demo data:", err);
      alert("Failed to reset demo dataset. Check backend connection.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] flex flex-col items-center justify-center p-6 font-mono">
        <div className="bg-[#12161C] border border-[#D9A441] p-8 max-w-md w-full space-y-4 text-center rounded-[2px] shadow-2xl">
          <div className="w-12 h-12 bg-[#D9A441]/10 border border-[#D9A441] rounded-[2px] flex items-center justify-center mx-auto text-[#D9A441]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase">SHIELD CORE SYSTEM</h1>
            <p className="text-xs text-[#8A9099] tracking-widest uppercase mt-1">
              PERSONNEL WELFARE EARLY-WARNING PROTOTYPE
            </p>
          </div>
          
          <div className="py-4 space-y-2">
            <div className="w-full bg-[#0B0E11] h-1.5 overflow-hidden rounded-[2px] border border-[#1E2630]">
              <div className="h-full bg-[#D9A441] animate-pulse w-3/4"></div>
            </div>
            <p className="text-xs text-[#D9A441] animate-pulse">{initMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (backendError) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#E8E6E1] flex flex-col items-center justify-center p-6 font-mono">
        <div className="bg-[#12161C] border-2 border-[#A33F3F] p-8 max-w-lg w-full space-y-4 text-center rounded-[2px]">
          <div className="w-12 h-12 bg-[#A33F3F]/10 border border-[#A33F3F] rounded-[2px] flex items-center justify-center mx-auto text-[#A33F3F]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#A33F3F] uppercase tracking-wider">
            BACKEND CONNECTION ERROR
          </h1>
          <p className="text-xs text-[#E8E6E1] leading-relaxed">
            {backendError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#D9A441] text-black font-bold text-xs uppercase tracking-wider rounded-[2px] hover:bg-[#b88932]"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0B0E11] text-[#E8E6E1]' : 'bg-[#F4F2ED] text-[#1A1D21]'
    }`}>
      
      {/* Header Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onResetDemo={handleResetDemoData}
        isResetting={isResetting}
      />

      {/* Main View Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 mb-16">
        {currentRole === 'PERSONNEL' && (
          <PersonnelView currentUser={currentUser} />
        )}

        {currentRole === 'WELFARE_OFFICER' && (
          <WelfareOfficerView currentUser={currentUser} />
        )}

        {currentRole === 'COMMANDER' && (
          <CommanderView currentUser={currentUser} />
        )}
      </main>

      {/* Persistent Classification Stamp Banner Footer */}
      <footer className="fixed bottom-3 left-4 z-30 pointer-events-none">
        <div className="px-3 py-1.5 bg-[#12161C]/90 dark:bg-[#12161C]/90 light:bg-white/90 backdrop-blur-sm border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] text-[10px] font-mono tracking-widest text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] uppercase rounded-[2px] shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-ping"></span>
          <span>PROTOTYPE DEMONSTRATION — SYNTHETIC DATA BENCHMARK</span>
        </div>
      </footer>

    </div>
  );
}
