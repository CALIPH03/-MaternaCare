import React, { useState, useEffect } from 'react';
import { getAllFromLocal, saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { Patient, Admission, HandoverRecord } from '@/src/types';
import { LogOut, ClipboardList, AlertCircle, ChevronRight, Save, History, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useAuthStore } from '@/src/store/useAuthStore';
import { logAction } from '@/src/lib/audit';

export default function HandoverManager() {
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCritical, setSelectedCritical] = useState<Record<string, { flagged: boolean, reason: string, status: string }>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadData() {
      try {
        const [admData, patData, handData] = await Promise.all([
          getAllFromLocal('admissions'),
          getAllFromLocal('patients'),
          getAllFromLocal('handover_logs')
        ]);

        const active = (admData as Admission[]).filter(a => a.status === 'active');
        setActiveAdmissions(active);

        const patMap: Record<string, Patient> = {};
        (patData as Patient[]).forEach(p => patMap[p.id] = p);
        setPatients(patMap);

        setHandovers((handData as HandoverRecord[]).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleCritical = (patientId: string) => {
    setSelectedCritical(prev => ({
      ...prev,
      [patientId]: {
        flagged: !prev[patientId]?.flagged,
        reason: prev[patientId]?.reason || '',
        status: (prev[patientId]?.status as any) || 'stable'
      }
    }));
  };

  const handleToggleStatus = (patientId: string, status: string) => {
    setSelectedCritical(prev => ({
      ...prev,
      [patientId]: { ...prev[patientId], status }
    }));
  };

  const handleUpdateReason = (patientId: string, reason: string) => {
    setSelectedCritical(prev => ({
      ...prev,
      [patientId]: { ...prev[patientId], reason }
    }));
  };

  const handleSubmitHandover = async () => {
    if (!user) return;

    const criticalCases = Object.entries(selectedCritical)
      .filter(([_, val]) => (val as any).flagged)
      .map(([id, val]) => ({
        patientId: id,
        patientName: patients[id]?.fullName || 'Unknown',
        reason: (val as any).reason,
        status: (val as any).status as any
      }));

    const handover: HandoverRecord = {
      id: crypto.randomUUID(),
      facilityId: user.facilityId,
      ward: 'Maternity A', // Mock ward
      outgoingNurseId: user.id,
      outgoingNurseName: user.name,
      timestamp: new Date().toISOString(),
      criticalCases,
      generalNotes,
      isAcknowledged: false
    };

    try {
      await saveToLocal('handover_logs', handover);
      await addToSyncQueue({ tableName: 'handover_logs', operation: 'INSERT', payload: handover });
      
      await logAction(
        user.id,
        user.name,
        user.role,
        'SHIFT_HANDOVER',
        'handover_log',
        handover.id,
        `Completed shift handover with ${criticalCases.length} critical cases highlighted.`
      );

      setHandovers([handover, ...handovers]);
      setIsCreating(false);
      setSelectedCritical({});
      setGeneralNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-m-teal" />
            Duty Handover
          </h2>
          <p className="text-sm text-slate-500 font-medium">Clinical accountability & shift management</p>
        </div>

        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <LogOut size={18} />
            Begin Handover
          </button>
        )}
      </div>

      <AnimatePresence>
        {isCreating ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bento-card">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-m-amber" />
                  Flag Critical Cases
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {activeAdmissions.map(admission => {
                    const patient = patients[admission.patientId];
                    const isFlagged = selectedCritical[admission.patientId]?.flagged;
                    
                    return (
                      <div key={admission.id} className={`p-4 rounded-2xl border-2 transition-all ${isFlagged ? 'border-m-amber bg-m-amber/5 shadow-lg shadow-m-amber/10' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isFlagged ? 'bg-m-amber text-white' : 'bg-slate-200 text-slate-500'}">
                              {patient?.fullName?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{patient?.fullName}</span>
                          </div>
                          <button 
                            onClick={() => handleToggleCritical(admission.patientId)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${
                              isFlagged ? 'bg-m-amber text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                            }`}
                          >
                            {isFlagged ? 'Flagged' : 'Flag for Watch'}
                          </button>
                        </div>

                        {isFlagged && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 pt-3 border-t border-m-amber/20">
                            <div className="flex gap-2">
                              {['stable', 'unstable', 'emergency'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleToggleStatus(admission.patientId, status)}
                                  className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                    selectedCritical[admission.patientId].status === status
                                      ? 'bg-m-red text-white border-m-red'
                                      : 'bg-white text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                            <textarea 
                              placeholder="Clinical reason (e.g. FHR decelerations, PPH risk...)"
                              className="w-full p-3 bg-white border border-m-amber/30 rounded-xl text-xs font-medium focus:ring-2 ring-m-amber/20 focus:outline-none"
                              value={selectedCritical[admission.patientId].reason}
                              onChange={(e) => handleUpdateReason(admission.patientId, e.target.value)}
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bento-card">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Shift Clinical Memo</h3>
                  <textarea 
                    placeholder="General ward observations, supply shortages, or staffing notes..."
                    className="form-input h-48 py-4 px-4 text-xs font-medium font-mono leading-relaxed"
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setIsCreating(false)} className="btn-secondary flex-1 py-4">Cancel Handover</button>
                  <button onClick={handleSubmitHandover} className="btn-primary flex-1 py-4 bg-m-teal hover:bg-m-teal/90 shadow-m-teal/20 flex items-center justify-center gap-2">
                    <Save size={20} />
                    Complete Sign-Off
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {handovers.map(log => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card group hover:shadow-xl hover:shadow-m-teal/5 transition-all cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-m-teal group-hover:text-white transition-colors">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{format(new Date(log.timestamp), 'MMM d, yyyy')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-m-green rounded-full shadow-[0_0_8px_rgba(15,110,86,0.5)]" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <UserCheck size={14} className="text-m-teal" />
                    Outgoing: <span className="font-bold text-slate-800">{log.outgoingNurseName}</span>
                  </div>
                  
                  {log.criticalCases.length > 0 && (
                    <div className="p-3 bg-m-red/5 rounded-xl border border-m-red/10">
                      <p className="text-[9px] font-bold text-m-red uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {log.criticalCases.length} Critical Watchlist
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {log.criticalCases.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white text-slate-700 text-[8px] font-bold rounded-lg border border-m-red/10">
                            {c.patientName.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 font-medium italic line-clamp-3 leading-relaxed">
                    {log.generalNotes || "No clinical memo provided."}
                  </p>
                </div>

                <button className="w-full mt-4 py-2 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-m-teal transition-all">
                  View Full Handover Memo
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
