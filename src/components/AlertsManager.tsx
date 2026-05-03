import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, BadgeCheck, Clock, ExternalLink, Activity } from 'lucide-react';
import { getAllFromLocal, saveToLocal } from '@/src/lib/offline.ts';
import { ClinicalAlert, AlertLevel } from '@/src/types';
import { format } from 'date-fns';

export default function AlertsManager() {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await getAllFromLocal('clinical_alerts');
        setAlerts((data as ClinicalAlert[]).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const acknowledgeAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    const updatedAlert = {
      ...alert,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: 'current-user-id', // Would be from auth store
    };

    await saveToLocal('clinical_alerts', updatedAlert);
    setAlerts(prev => prev.map(a => a.id === id ? updatedAlert : a));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-m-teal border-t-transparent animate-spin rounded-full" /></div>;

  const activeAlerts = alerts.filter(a => !a.acknowledgedAt);
  const history = alerts.filter(a => a.acknowledgedAt);

  return (
    <div className="py-2 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Clinical Alerts</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">WHO Decision Support Monitor • {activeAlerts.length} Active</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-m-red/10 border border-m-red/20 rounded-full text-m-red text-[10px] font-bold uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-m-red animate-ping" />
            Live Priority
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-12">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Active Priority Alerts</h3>
        {activeAlerts.length > 0 ? (
          activeAlerts.map(alert => (
            <div key={alert.id} className={`bento-card relative overflow-hidden transition-all ${
              alert.level === AlertLevel.EMERGENCY ? 'border-l-8 border-m-red bg-m-red/5' : 
              alert.level === AlertLevel.ALERT ? 'border-l-8 border-m-amber bg-m-amber/5' : 
              'border-l-8 border-m-teal bg-m-teal/5'
            }`}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${
                      alert.level === AlertLevel.EMERGENCY ? 'badge-red' : 
                      alert.level === AlertLevel.ALERT ? 'badge-amber' : 
                      'badge-teal'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-tighter">
                      {format(new Date(alert.createdAt), 'HH:mm:ss')} • {alert.type}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">{alert.message}</h4>
                  <div className="p-3 bg-white/60 border border-slate-200/50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 italic">WHO Recommendation:</p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{alert.recommendation}</p>
                  </div>
                </div>
                
                <div className="md:w-48 flex flex-col justify-end gap-2">
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className={`btn-primary w-full h-12 flex items-center justify-center gap-2 ${
                      alert.level === AlertLevel.EMERGENCY ? 'bg-m-red hover:bg-m-red/90 shadow-m-red/20' : 
                      alert.level === AlertLevel.ALERT ? 'bg-m-amber hover:bg-m-amber/90 shadow-m-amber/20' : 
                      ''
                    }`}
                  >
                    <BadgeCheck size={18} />
                    Acknowledge
                  </button>
                  <button className="btn-secondary w-full h-10 flex items-center justify-center gap-2">
                    <ExternalLink size={14} />
                    View Patient
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bento-card py-12 text-center">
            <BadgeCheck size={48} className="mx-auto text-m-green/30 mb-4" />
            <h4 className="text-lg font-bold text-slate-600">No active priority alerts</h4>
            <p className="text-sm text-slate-400">All clinical observations are within the expected WHO parameters.</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Acknowledgement History</h3>
          <div className="space-y-2">
            {history.map(alert => (
              <div key={alert.id} className="bento-card py-3 flex items-center justify-between border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    alert.level === AlertLevel.EMERGENCY ? 'bg-m-red/10 text-m-red' : 
                    alert.level === AlertLevel.ALERT ? 'bg-m-amber/10 text-m-amber' : 
                    'bg-m-teal/10 text-m-teal'
                  }`}>
                    {alert.level === AlertLevel.EMERGENCY ? <ShieldAlert size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-700">{alert.type}: {alert.message}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Resolved {format(new Date(alert.acknowledgedAt!), 'HH:mm')} • ID: #MC-{alert.id.slice(0,4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono text-slate-400 uppercase">Nurse J.N.</p>
                  <div className="flex items-center gap-1 text-m-green justify-end">
                    <BadgeCheck size={12} />
                    <span className="text-[10px] font-bold uppercase">ACK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
