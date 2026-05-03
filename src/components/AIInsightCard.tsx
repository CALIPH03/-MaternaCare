import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClinicalInsight, analyzeLabourProgress } from '../services/clinicalAdvisor';
import { Patient, Admission, PartographEntry } from '../types';

interface Props {
  patient: Patient;
  admission: Admission;
  entries: PartographEntry[];
}

export default function AIInsightCard({ patient, admission, entries }: Props) {
  const [insight, setInsight] = useState<ClinicalInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (entries.length === 0) return;
    setLoading(true);
    try {
      const result = await analyzeLabourProgress(patient, admission, entries);
      setInsight(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-m-red text-white';
      case 'warning': return 'bg-m-amber text-white';
      default: return 'bg-m-teal text-white';
    }
  };

  return (
    <div className="bento-card overflow-hidden relative group">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-m-teal/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
      
      <div className="relative flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-m-teal/10 rounded-2xl flex items-center justify-center text-m-teal">
              <Sparkles size={20} className={loading ? "animate-pulse" : ""} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Clinical Advisor</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">AI Insight Engine</p>
            </div>
          </div>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading || entries.length === 0}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-m-teal disabled:opacity-50"
            title="Refresh Analysis"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!insight && !loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-6"
            >
              <div className="p-4 rounded-full bg-slate-50 text-slate-300 mb-4">
                <Sparkles size={32} />
              </div>
              <p className="text-xs text-slate-500 font-bold max-w-[200px]">
                {entries.length === 0 
                  ? "Awaiting first partograph observations..." 
                  : "Ready to analyze labour progress trends."}
              </p>
              {entries.length > 0 && (
                <button 
                  onClick={handleAnalyze}
                  className="mt-4 px-4 py-2 bg-m-teal text-white text-xs font-bold rounded-xl shadow-lg shadow-m-teal/20"
                >
                  Generate Analysis
                </button>
              )}
            </motion.div>
          ) : loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-6"
            >
              <Loader2 size={32} className="text-m-teal animate-spin mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analyzing clinical data...</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-3 rounded-xl flex items-center gap-3 ${getStatusColor(insight!.status)}`}>
                {insight!.status === 'critical' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <p className="text-xs font-bold leading-tight">{insight!.summary}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Info size={12} />
                  Actionable Steps
                </h4>
                <ul className="space-y-1.5">
                  {insight!.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-m-teal rounded-full shrink-0 mt-1.5" />
                      <span className="text-xs text-slate-600 font-medium leading-tight">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clinical Reasoning</p>
                <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">{insight!.reasoning}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
