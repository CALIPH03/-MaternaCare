import React, { useState, useEffect } from 'react';
import { getAllFromLocal } from '@/src/lib/offline.ts';
import { AuditLog } from '@/src/types';
import { format } from 'date-fns';
import { History, Shield, User, Activity, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await getAllFromLocal('audit_logs');
        setLogs((data as AuditLog[]).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Failed to load logs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || log.entityType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('INSERT') || action.includes('Created')) return <div className="w-8 h-8 bg-m-green/10 text-m-green rounded-full flex items-center justify-center"><Activity size={14} /></div>;
    if (action.includes('UPDATE') || action.includes('Modified')) return <div className="w-8 h-8 bg-m-teal/10 text-m-teal rounded-full flex items-center justify-center"><Filter size={14} /></div>;
    return <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center"><Shield size={14} /></div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="text-m-teal" />
            Audit Trail
          </h2>
          <p className="text-sm text-slate-500 font-medium">Full clinical accountability log</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-input w-full sm:w-48"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Entities</option>
            <option value="patient">Patients</option>
            <option value="admission">Admissions</option>
            <option value="partograph_entry">Observations</option>
            <option value="delivery">Deliveries</option>
            <option value="infant">Infants</option>
          </select>
        </div>
      </div>

      <div className="bento-card overflow-hidden p-0 border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No matching audit logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={log.id} 
                    className="text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-m-teal/5 text-m-teal rounded-full flex items-center justify-center font-bold">
                          {log.userName?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{log.userName}</span>
                          <span className="text-[10px] text-m-teal font-bold tracking-widest uppercase italic">{log.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getActionIcon(log.action)}
                        <span className="capitalize">{log.action.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest leading-none">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
