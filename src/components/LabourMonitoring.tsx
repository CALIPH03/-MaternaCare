import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, Activity, Clock, AlertTriangle, FileText, UserCheck } from 'lucide-react';
import { getFromLocal, getQueryFromLocal, getAllFromLocal } from '@/src/lib/offline.ts';
import { Patient, Admission, PartographEntry, Delivery, Infant } from '@/src/types';
import PartographChart from './PartographChart';
import PartographEntryForm from './PartographEntryForm';
import DeliveryForm from './DeliveryForm';
import InfantForm from './InfantForm';
import ReferralForm from './ReferralForm';
import AIInsightCard from './AIInsightCard';
import PatientPassport from './PatientPassport';
import { format } from 'date-fns';
import { generateDischargeReport } from '@/src/lib/report-generator.ts';

interface Props {
  patientId: string;
  onBack: () => void;
}

export default function LabourMonitoring({ patientId, onBack }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [entries, setEntries] = useState<PartographEntry[]>([]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [infants, setInfants] = useState<Infant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'monitoring' | 'delivery' | 'infant' | 'referral' | 'passport'>('monitoring');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const patientData = await getFromLocal('patients', patientId);
        const admissionData = await getQueryFromLocal('admissions', 'patientId', patientId);
        const entriesData = await getQueryFromLocal('partograph_entries', 'patientId', patientId);
        const deliveryData = await getQueryFromLocal('deliveries', 'patientId', patientId);
        const infantsData = await getQueryFromLocal('infants', 'motherId', patientId);

        setPatient(patientData as Patient);
        if (admissionData.length > 0) setAdmission(admissionData[0] as Admission);
        if (deliveryData.length > 0) setDelivery(deliveryData[0] as Delivery);
        setInfants(infantsData as Infant[]);
        
        setEntries((entriesData as PartographEntry[]).sort((a, b) => 
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        ));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  const handleDownloadReport = async () => {
    if (!patient || !admission) return;
    setIsGeneratingReport(true);
    try {
      await generateDischargeReport(patient, admission, delivery, infants, entries);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleEntryAdded = (newEntry: PartographEntry) => {
    setEntries(prev => [...prev, newEntry].sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    ));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-m-teal border-t-transparent animate-spin rounded-full" /></div>;
  if (!patient || !admission) return <div className="p-8 text-center bg-white bento-card">Patient record not found.</div>;

  const currentDilation = entries.length > 0 ? entries[entries.length - 1].cervicalDilation : admission.cervicalDilation;
  const currentFHR = entries.length > 0 ? entries[entries.length - 1].fetalHeartRate : 140;

  return (
    <div className="py-2 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={activeView === 'monitoring' ? onBack : () => setActiveView('monitoring')} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{patient.fullName}</h2>
              <span className="badge badge-teal">{admission.ward}</span>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {patient.age} YRS • G{admission.gravida} P{admission.para} • {admission.gestationWeeks} WKS GESTATION
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {activeView === 'monitoring' && (
            <>
              <button 
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                className="btn-secondary flex items-center gap-2"
              >
                {isGeneratingReport ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 animate-spin rounded-full" /> : <FileText size={16} />}
                Download Discharge Report
              </button>
              <button 
                onClick={() => setActiveView('delivery')}
                className="btn-primary bg-m-green hover:bg-m-green/90 flex items-center gap-2 shadow-m-green/20"
              >
                <Activity size={16} />
                Record Delivery
              </button>
            </>
          )}
          {activeView === 'monitoring' && (
            <button 
              onClick={() => setActiveView('referral')}
              className="btn-primary bg-m-red hover:bg-m-red/90 flex items-center gap-2 shadow-m-red/20"
            >
              <AlertTriangle size={16} />
              Transfer
            </button>
          )}

          {activeView === 'monitoring' && (
            <button 
              onClick={() => setActiveView('passport')}
              className="btn-secondary flex items-center gap-2"
            >
              <UserCheck size={16} />
              Passport
            </button>
          )}
        </div>
      </div>

      {activeView === 'monitoring' && (
        <>
          {/* Real-time Status Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard 
              label="Cervical Dilation" 
              value={`${currentDilation} cm`} 
              icon={<Activity size={24} />} 
              trend={entries.length > 1 ? (currentDilation - entries[entries.length - 2].cervicalDilation) : 0}
            />
            <StatusCard 
              label="Fetal Heart Rate" 
              value={`${currentFHR} bpm`} 
              icon={<HeartIcon size={24} />} 
              status={currentFHR < 110 || currentFHR > 160 ? 'critical' : 'normal'}
            />
            <StatusCard 
              label="Time in Active Labour" 
              value={`${Math.round((new Date().getTime() - new Date(admission.admittedAt).getTime()) / (1000 * 60 * 60))} hrs`} 
              icon={<Clock size={24} />} 
            />
            <StatusCard 
              label="Contractions / 10m" 
              value={entries.length > 0 ? (entries[entries.length - 1].contractionsCount ?? '—').toString() : '—'} 
              icon={<Activity size={24} className="text-m-amber" />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PartographChart entries={entries} />
            </div>
            <div>
              <AIInsightCard patient={patient} admission={admission} entries={entries} />
            </div>
          </div>

          {/* Observation Form Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">New Clinical Observation</h3>
            <PartographEntryForm 
              admissionId={admission.id} 
              patientId={patient.id} 
              onEntryAdded={handleEntryAdded}
              existingEntries={entries}
            />
          </div>

          {/* Observation History */}
          <div className="bento-card overflow-hidden p-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Observation Logs</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total: {entries.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">FHR</th>
                    <th className="px-4 py-3">Liquor</th>
                    <th className="px-4 py-3">Dilation</th>
                    <th className="px-4 py-3">Contr.</th>
                    <th className="px-4 py-3">BP</th>
                    <th className="px-4 py-3">Temp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entries.map(entry => (
                    <tr key={entry.id} className="text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{format(new Date(entry.recordedAt), 'HH:mm')}</td>
                      <td className="px-4 py-3">{entry.fetalHeartRate} bpm</td>
                      <td className="px-4 py-3">{entry.liquor}</td>
                      <td className="px-4 py-3">{entry.cervicalDilation} cm</td>
                      <td className="px-4 py-3">{entry.contractionsCount}x/{entry.contractionsDuration}s</td>
                      <td className="px-4 py-3">{entry.systolicBP}/{entry.diastolicBP}</td>
                      <td className="px-4 py-3">{entry.temperature}°C</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'delivery' && (
        <DeliveryForm 
          admissionId={admission.id} 
          patientId={patient.id} 
          onComplete={() => setActiveView('infant')} 
        />
      )}

      {activeView === 'infant' && (
        <InfantForm 
          admissionId={admission.id} 
          patientId={patient.id} 
          onComplete={onBack} 
        />
      )}

      {activeView === 'referral' && (
        <ReferralForm 
          patient={patient}
          admission={admission}
          entries={entries}
          onComplete={onBack}
          onCancel={() => setActiveView('monitoring')}
        />
      )}

      {activeView === 'passport' && (
        <PatientPassport 
          patient={patient}
          admission={admission}
          onClose={() => setActiveView('monitoring')}
        />
      )}
    </div>
  );
}

function StatusCard({ label, value, icon, trend, status }: { label: string; value: string; icon: React.ReactNode; trend?: number; status?: 'normal' | 'critical' }) {
  return (
    <div className={`bento-card border-none ${status === 'critical' ? 'bg-m-red/5' : 'bg-white'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${status === 'critical' ? 'bg-m-red/10 text-m-red' : 'bg-m-teal/10 text-m-teal'}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-800 tracking-tighter">{value}</p>
        {trend !== undefined && trend > 0 && (
          <span className="text-[10px] font-bold text-m-green">+{trend} cm change</span>
        )}
      </div>
    </div>
  );
}

function HeartIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
