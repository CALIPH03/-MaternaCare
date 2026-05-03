import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, Key, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  children: React.ReactNode;
}

export default function AuthGate({ children }: Props) {
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());

  const CORRECT_PIN = '1234'; // Default PIN for MVP
  const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const handleActivity = () => setLastActive(Date.now());
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    const interval = setInterval(() => {
      if (isAuthenticated && Date.now() - lastActive > AUTO_LOCK_TIME) {
        setIsAuthenticated(false);
        setPin('');
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, lastActive]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      setError(false);
      setLastActive(Date.now());
    } else {
      setError(true);
      setPin('');
      // Haptic feedback simulation
      navigator.vibrate?.(100);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        {children}
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="fixed bottom-6 right-6 p-4 bg-white text-slate-400 hover:text-m-red shadow-2xl rounded-full border border-slate-100 transition-all z-50 flex items-center gap-2 group"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all text-xs font-bold uppercase tracking-widest pl-2">Lock Terminal</span>
          <Lock size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 radial-dots">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-m-teal text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-m-teal/20 rotate-3">
            <UserCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clinical Authentication</h1>
          <p className="text-sm text-slate-500 font-medium">Enter 4-digit PIN to access ward terminal</p>
        </div>

        <div className="bento-card p-8 bg-white border border-slate-100 shadow-2xl relative overflow-hidden">
          {error && (
            <motion.div 
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              className="absolute top-0 left-0 right-0 p-2 bg-m-red text-white text-[10px] font-bold uppercase tracking-widest text-center"
            >
              Invalid Access Credentials
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-12 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all border-2 ${
                    pin.length > i 
                      ? 'bg-m-teal/5 border-m-teal text-m-teal scale-105' 
                      : 'bg-slate-50 border-slate-100 text-slate-300'
                  }`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-16 rounded-2xl bg-slate-50 hover:bg-m-teal hover:text-white text-slate-700 text-xl font-bold transition-all flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}
              <div className="h-16" />
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-16 rounded-2xl bg-slate-50 hover:bg-m-teal hover:text-white text-slate-700 text-xl font-bold transition-all flex items-center justify-center shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-slate-50 hover:text-m-red text-slate-400 text-sm font-bold transition-all flex items-center justify-center"
              >
                DEL
              </button>
            </div>

            <button 
              type="submit"
              disabled={pin.length < 4}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg ${
                pin.length >= 4 
                  ? 'bg-m-teal text-white shadow-m-teal/30 scale-[1.02]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Unlock size={20} />
              Unlock System
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Key size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Device Authorized</span>
          </div>
        </div>
      </motion.div>

      {/* Decorative dots background */}
      <style>{`
        .radial-dots {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}
