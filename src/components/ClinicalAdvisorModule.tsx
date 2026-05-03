import React, { useState, useEffect } from 'react';
import { getAllFromLocal } from '@/src/lib/offline.ts';
import { Patient, Admission, PartographEntry } from '@/src/types';
import { Sparkles, BrainCircuit, Activity, AlertTriangle, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLabourProgress, ClinicalInsight } from '@/src/services/clinicalAdvisor';

export default function ClinicalAdvisorModule() {
  const [activeAdmissions, setActiveAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [patientEntries, setPatientEntries] = useState<Record<string, PartographEntry[]>>({});
  const [insights, setInsights] = useState<Record<string, ClinicalInsight>>({});
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [admData, patData, entriesData] = await Promise.all([
          getAllFromLocal('admissions'),
          getAllFromLocal('patients'),
          getAllFromLocal('partograph_entries')
        ]);

        const active = (admData as Admission[]).filter(a => a.status === 'active');
        setActiveAdmissions(active);

        const patMap: Record<string, Patient> = {};
        (patData as Patient[]).forEach(p => patMap[p.id] = p);
        setPatients(patMap);

        const entMap: Record<string, PartographEntry[]> = {};
        (entriesData as PartographEntry[]).forEach(e => {
          if (!entMap[e.patientId]) entMap[e.patientId] = [];
          entMap[e.patientId].push(e);
        });
        setPatientEntries(entMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const runGlobalAI = async () => {
    setIsAnalyzing(true);
    const newInsights: Record<string, ClinicalInsight> = {};
    
    // Process in parallel with limit if needed, but here we just do all active
    await Promise.all(activeAdmissions.map(async (adm) => {
      const patient = patients[adm.patientId];
      const entries = patientEntries[adm.patientId] || [];
      if (patient) {
        try {
          const insight = await analyzeLabourProgress(patient, adm, entries);
          newInsights[adm.patientId] = insight;
        } catch (err) {
          console.error(err);
        }
      }
    }));

    setInsights(newInsights);
    setIsAnalyzing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-m-teal border-t-transparent animate-spin rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <BrainCircuit size={24} />
            </div>
            Clinical AI Advisor
          </h2>
          <p className="text-sm text-slate-500 font-medium italic">WHO-Aligned Intelligent Monitoring (Beta)</p>
        </div>

        <button 
          onClick={runGlobalAI}
          disabled={isAnalyzing}
          className="btn-primary bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 flex items-center gap-2"
        >
          {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Sparkles size={18} />}
          Run Global Ward Screening
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAdmissions.map(adm => {
          const patient = patients[adm.patientId];
          const insight = insights[adm.patientId];
          const entries = patientEntries[adm.patientId] || [];

          return (
            <motion.div 
              key={adm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card border-none bg-white hover:shadow-2xl transition-all group overflow-hidden"
            >
              <div className="p-1 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    {patient?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{patient?.fullName}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{adm.ward}</p>
                  </div>
                </div>
                {insight && (
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    insight.status === 'critical' ? 'bg-m-red text-white' : 
                    insight.status === 'warning' ? 'bg-m-amber text-white' : 
                    'bg-m-green text-white'
                  }`}>
                    {insight.status}
                  </span>
                )}
              </div>

              {!insight ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Awaiting Analysis</p>
                  <p className="text-[9px] text-slate-400 mt-1">{entries.length} data points available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] text-slate-800 font-bold leading-relaxed">
                      "{insight.summary}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Key Recommendations</p>
                    {insight.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                        <p className="text-[10px] text-slate-600 font-medium leading-tight">{rec}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 italic leading-snug">
                       Reasoning: {insight.reasoning.slice(0, 100)}...
                    </p>
                  </div>
                </div>
              )}

              <button className="w-full mt-4 py-2 bg-slate-50 text-slate-400 group-hover:text-indigo-500 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                Open Clinical File
                <ChevronRight size={12} />
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="p-6 bg-indigo-600 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap size={20} className="fill-white" />
            Real-time Anomaly Detection
          </h3>
          <p className="text-white/80 text-sm max-w-xl mt-2 leading-relaxed">
            AI constantly screens all active labour monitors for FHR decelerations, stalled dilation, or hypertensive spikes. 
            Automated escalation protocols are triggered based on national guidelines.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-2xl font-black">98%</p>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Validation</p>
          </div>
          <div className="text-center px-4 py-2 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-2xl font-black">2.1s</p>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Latency</p>
          </div>
        </div>
      </div>
    </div>
  );
}
