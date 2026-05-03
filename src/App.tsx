import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Bell, 
  Menu,
  Stethoscope,
  History,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdmissionForm from './components/AdmissionForm';
import PatientList from './components/PatientList';
import AlertsManager from './components/AlertsManager';
import LabourMonitoring from './components/LabourMonitoring';
import WardDashboard from './components/WardDashboard';
import AuthGate from './components/AuthGate';
import AdminPanel from './components/AdminPanel';
import AuditTrail from './components/AuditTrail';
import HandoverManager from './components/HandoverManager';
import MOH711Dashboard from './components/MOH711Dashboard';
import ClinicalAdvisorModule from './components/ClinicalAdvisorModule';
import { useSyncStore } from './store/useSyncStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admission' | 'patients' | 'alerts' | 'admin' | 'audit' | 'handover' | 'reports' | 'advisor'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { isOnline, isSyncing, queue, setOnline, loadQueue, triggerSync } = useSyncStore();

  useEffect(() => {
    loadQueue();
    
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      triggerSync();
    }
  }, [isOnline, queue.length]);

  return (
    <AuthGate>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 flex-col overflow-hidden">
      {/* Bento Header */}
      <header className="h-16 bg-m-teal text-white flex items-center justify-between px-6 shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg">
            <Stethoscope size={24} className="text-m-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">MaternaCare</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Mbagathi District Hospital • Labor Ward</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-m-teal-dark p-1 rounded-xl">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16} />} label="Dashboard" />
          <NavButton active={activeTab === 'admission'} onClick={() => setActiveTab('admission')} icon={<PlusCircle size={16} />} label="Admission" />
          <NavButton active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} icon={<Users size={16} />} label="Patients" />
          <NavButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<Bell size={16} />} label="Alerts" />
          <NavButton active={activeTab === 'handover'} onClick={() => setActiveTab('handover')} icon={<ClipboardList size={16} />} label="Handover" />
          <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileBarChart size={16} />} label="Reports" />
          <NavButton active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')} icon={<BrainCircuit size={16} />} label="AI Advisor" />
          <NavButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<History size={16} />} label="Audit" />
          <NavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Settings size={16} />} label="Settings" />
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-m-teal-dark rounded-full">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-m-green animate-pulse' : 'bg-m-amber'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isOnline ? 'Online' : 'Offline'} • {queue.length} in queue
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-3 text-right">
            <div>
              <p className="text-xs font-bold leading-none italic">Nurse Jane Nyambura</p>
              <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">Shift: 08:00 - 16:00</p>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/10">
              JN
            </div>
          </div>
        </div>
      </header>

      {/* Grid Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <WardDashboard onPatientSelect={(id) => {
                setSelectedPatientId(id);
                setActiveTab('patients');
              }} />
            </motion.div>
          )}

          {activeTab === 'admission' && (
            <motion.div
              key="admission"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              <AdmissionForm />
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {selectedPatientId ? (
                <LabourMonitoring 
                  patientId={selectedPatientId} 
                  onBack={() => setSelectedPatientId(null)} 
                />
              ) : (
                <PatientList onPatientSelect={(id) => setSelectedPatientId(id)} />
              )}
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <AlertsManager />
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <AuditTrail />
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <AdminPanel />
            </motion.div>
          )}

          {activeTab === 'handover' && (
            <motion.div
              key="handover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <HandoverManager />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <MOH711Dashboard />
            </motion.div>
          )}

          {activeTab === 'advisor' && (
            <motion.div
              key="advisor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              <ClinicalAdvisorModule />
            </motion.div>
          )}

          {activeTab !== 'admission' && activeTab !== 'patients' && activeTab !== 'alerts' && activeTab !== 'audit' && activeTab !== 'admin' && activeTab !== 'handover' && activeTab !== 'dashboard' && activeTab !== 'reports' && activeTab !== 'advisor' && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full max-w-7xl mx-auto"
            >
              <div className="md:col-span-12 items-center justify-center flex py-20">
                <div className="bento-card max-w-md text-center">
                  <Activity size={48} className="mx-auto mb-4 text-m-gray-300" />
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Module Coming Soon</h2>
                  <p className="text-sm text-slate-500 mt-2">
                    We are currently building the <span className="font-bold text-m-teal uppercase">{activeTab}</span> component.
                    This bento layout will feature real-time clinical monitoring once complete.
                  </p>
                  <button onClick={() => setActiveTab('admission')} className="btn-primary mt-6 mx-auto">
                    Return to Admission
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* System Footer Bar */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex gap-4 text-[9px] font-mono text-slate-500 uppercase font-bold">
          <span>v1.2.4-stable</span>
          <span>AWS-af-south-1</span>
          <span>Device: NURSE-PAD-04</span>
        </div>
        <div className="text-[9px] font-bold text-m-teal tracking-widest uppercase">
          KDPA 2019 COMPLIANT • END-TO-END ENCRYPTED
        </div>
      </footer>
    </div>
  </AuthGate>
);
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${
        active 
          ? 'bg-white text-m-teal shadow-sm' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

