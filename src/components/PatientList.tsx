import React, { useState, useEffect } from 'react';
import { Search, User, Users, SlidersHorizontal, ChevronRight, Activity, Calendar, Clock } from 'lucide-react';
import { getAllFromLocal } from '@/src/lib/offline.ts';
import { Patient, Admission } from '@/src/types';
import { format } from 'date-fns';

interface Props {
  onPatientSelect: (id: string) => void;
}

export default function PatientList({ onPatientSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [wardFilter, setWardFilter] = useState('All Wards');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const patientsData = await getAllFromLocal('patients');
        const admissionsData = await getAllFromLocal('admissions');
        setPatients(patientsData as Patient[]);
        setAdmissions(admissionsData as Admission[]);
      } catch (err) {
        console.error('Failed to load patient data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const admission = admissions.find(a => a.patientId === patient.id);
    const matchesWard = wardFilter === 'All Wards' || admission?.ward === wardFilter;
    return matchesSearch && matchesWard;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-m-teal/20 border-t-m-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Ward Records • {filteredPatients.length} Patients</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-m-teal transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="form-input w-auto min-w-[140px]"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option>All Wards</option>
            <option>Labour Ward</option>
            <option>Antenatal Ward</option>
            <option>Triage / Observation</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => {
            const admission = admissions.find(a => a.patientId === patient.id);
            return (
              <div 
                key={patient.id} 
                onClick={() => onPatientSelect(patient.id)}
                className="bento-card hover:border-m-teal/30 hover:translate-y-[-2px] group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-m-gray-100 rounded-2xl flex items-center justify-center text-m-teal group-hover:bg-m-teal group-hover:text-white transition-all">
                    <User size={24} />
                  </div>
                  <div className="text-right">
                    <span className="badge badge-teal">{admission?.ward || 'General'}</span>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold">#MC-{patient.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{patient.fullName}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {patient.age} yrs</span>
                    <span className="flex items-center gap-1"><Activity size={12} /> G{admission?.gravida} P{admission?.para}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {admission?.gestationWeeks} wks</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Admitted: {admission ? format(new Date(admission.admittedAt), 'MMM dd, HH:mm') : 'Unknown'}
                  </div>
                  <button className="p-2 bg-m-teal/5 text-m-teal rounded-lg hover:bg-m-teal hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-m-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-600">No patients found</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Try adjusting your filters or admission search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
