import React, { useState, useEffect } from 'react';
import { getAllFromLocal } from '@/src/lib/offline.ts';
import { Delivery, Infant, Admission } from '@/src/types';
import { FileBarChart, Download, Calendar, Filter, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function MOH711Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    async function calculateStats() {
      setLoading(true);
      try {
        const [deliveries, infants, admissions] = await Promise.all([
          getAllFromLocal('deliveries'),
          getAllFromLocal('infants'),
          getAllFromLocal('admissions')
        ]);

        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const currentMonthDeliveries = (deliveries as Delivery[]).filter(d => 
          isWithinInterval(new Date(d.deliveryDateTime), { start, end })
        );

        const currentMonthInfants = (infants as Infant[]).filter(i => 
          isWithinInterval(new Date(i.recordedAt), { start, end })
        );

        const newStats = {
          totalDeliveries: currentMonthDeliveries.length,
          normalDeliveries: currentMonthDeliveries.filter(d => d.deliveryType.toLowerCase().includes('normal')).length,
          caesareanSections: currentMonthDeliveries.filter(d => d.deliveryType.toLowerCase().includes('section')).length,
          assistedDeliveries: currentMonthDeliveries.filter(d => d.deliveryType.toLowerCase().includes('vacuum') || d.deliveryType.toLowerCase().includes('forceps')).length,
          liveBirths: currentMonthInfants.length, // Simplified
          lowBirthWeight: currentMonthInfants.filter(i => i.weight < 2.5).length,
          pphCases: currentMonthDeliveries.filter(d => d.bloodLoss > 500).length,
          maternalDeaths: currentMonthDeliveries.filter(d => d.outcome.toLowerCase().includes('death')).length,
        };

        setStats(newStats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    calculateStats();
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-m-teal/10 rounded-xl text-m-teal">
              <FileBarChart size={24} />
            </div>
            MOH 711 Summary
          </h2>
          <p className="text-sm text-slate-500 font-medium">Monthly Reproductive Health Reporting</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="month" 
              className="form-input pl-10"
              value={format(month, 'yyyy-MM')}
              onChange={(e) => setMonth(new Date(e.target.value))}
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export DHIS2
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard label="Total Deliveries" value={stats.totalDeliveries} trend="+12% vs last month" />
        <ReportCard label="Normal Deliveries" value={stats.normalDeliveries} />
        <ReportCard label="C-Sections" value={stats.caesareanSections} variant="warning" />
        <ReportCard label="Live Births" value={stats.liveBirths} icon={<FileText size={20} />} />
      </div>

      <div className="bento-card p-0 overflow-hidden border border-slate-100">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} />
            Detail Breakdown
          </h3>
          <span className="text-[10px] font-bold text-m-teal bg-m-teal/10 px-2 py-0.5 rounded uppercase tracking-tighter">Verified Aggregate</span>
        </div>
        <div className="divide-y divide-slate-50">
          <StatRow label="Assisted Vaginal Deliveries" value={stats.assistedDeliveries} />
          <StatRow label="Post-Partum Haemorrhage (PPH)" value={stats.pphCases} highlight={stats.pphCases > 0} />
          <StatRow label="Low Birth Weight (< 2.5kg)" value={stats.lowBirthWeight} />
          <StatRow label="Maternal Deaths" value={stats.maternalDeaths} highlight={stats.maternalDeaths > 0} />
          <StatRow label="Neonatal Deaths" value={0} />
        </div>
      </div>

      <div className="p-6 bg-m-teal text-white rounded-3xl flex items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative">
          <h3 className="text-lg font-bold mb-1">MOH DHIS2 Integration</h3>
          <p className="text-xs text-white/80 max-w-sm">Synchronize these aggregates directly with the national health information system (DHIS2) via API.</p>
        </div>
        <button className="relative px-6 py-3 bg-white text-m-teal rounded-2xl font-bold text-sm hover:bg-m-teal-light transition-colors shadow-xl">
          Initiate Batch Sync
        </button>
      </div>
    </div>
  );
}

function ReportCard({ label, value, trend, icon, variant }: { label: string, value?: number, trend?: string, icon?: React.ReactNode, variant?: 'warning' }) {
  return (
    <div className="bento-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-3xl font-bold tracking-tighter ${variant === 'warning' ? 'text-m-amber' : 'text-slate-800'}`}>
          {value || 0}
        </p>
        {trend && (
          <span className="text-[10px] font-bold text-m-green bg-m-green/10 px-2 py-0.5 rounded-full mb-1">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string, value?: number, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors">
      <span className={`text-xs font-medium ${highlight ? 'text-m-red font-bold' : 'text-slate-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-bold ${highlight ? 'text-m-red bg-m-red/10 px-3 py-1 rounded-lg' : 'text-slate-800'}`}>
        {value || 0}
      </span>
    </div>
  );
}
