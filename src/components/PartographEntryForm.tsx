import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, Beaker, Heart, Thermometer, Droplets, Save, Clock } from 'lucide-react';
import { saveToLocal } from '@/src/lib/offline.ts';
import { logAction } from '@/src/lib/audit.ts';
import { useAuthStore } from '@/src/store/useAuthStore.ts';
import { runWHOAlerts } from '@/src/lib/who-alerts.ts';
import { PartographEntry } from '@/src/types';

const entrySchema = z.object({
  fetalHeartRate: z.number().min(60).max(220),
  liquor: z.string().min(1),
  moulding: z.number().min(0).max(3),
  cervicalDilation: z.number().min(0).max(10),
  fetalHeadDescent: z.number().min(0).max(5),
  contractionsCount: z.number().min(0).max(10),
  contractionsDuration: z.number().min(0).max(60),
  systolicBP: z.number().min(60).max(250),
  diastolicBP: z.number().min(40).max(160),
  pulse: z.number().min(40).max(200),
  temperature: z.number().min(34).max(43),
  proteinuria: z.string().optional(),
  acetone: z.string().optional(),
  volume: z.number().optional(),
  oxytocinUnits: z.number().optional(),
  oxytocinDrops: z.number().optional(),
});

interface Props {
  admissionId: string;
  patientId: string;
  onEntryAdded: (entry: PartographEntry) => void;
  existingEntries: PartographEntry[];
}

export default function PartographEntryForm({ admissionId, patientId, onEntryAdded, existingEntries }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      fetalHeartRate: 140,
      liquor: 'I',
      moulding: 0,
      cervicalDilation: 4,
      fetalHeadDescent: 4,
      contractionsCount: 3,
      contractionsDuration: 25,
      systolicBP: 120,
      diastolicBP: 80,
      pulse: 80,
      temperature: 36.6,
    }
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const newEntry: PartographEntry = {
        id: crypto.randomUUID(),
        admissionId,
        patientId,
        recordedAt: new Date().toISOString(),
        ...values,
      };

      // 1. Save entry locally
      await saveToLocal('partograph_entries', newEntry);

      // 2. Run clinical alerts logic
      const allEntries = [...existingEntries, newEntry];
      const newAlerts = runWHOAlerts(allEntries);
      
      // Save any new alerts
      for (const alert of newAlerts) {
        // Check if an alert of the same type for this admission was already created recently to avoid spam
        await saveToLocal('clinical_alerts', alert);
      }

      if (user) {
        await logAction(
          user.id,
          user.name,
          user.role,
          'RECORD_OBSERVATION',
          'partograph_entry',
          newEntry.id,
          `Recorded vital signs and labour progress for patient ${patientId}. Dilation: ${values.cervicalDilation}cm`
        );
      }

      onEntryAdded(newEntry);
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fetal Observation */}
        <div className="bento-card border-l-4 border-m-teal">
          <div className="flex items-center gap-2 mb-4 text-m-teal">
            <Heart size={18} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Fetal Observation</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">FHR (BPM)</label>
              <input type="number" {...register('fetalHeartRate', { valueAsNumber: true })} className="form-input" />
              {errors.fetalHeartRate && <p className="error-text">Required: 60-220</p>}
            </div>
            <div>
              <label className="input-label">Liquor</label>
              <select {...register('liquor')} className="form-input">
                <option value="I">Intact (I)</option>
                <option value="C">Clear (C)</option>
                <option value="M1">Meconium-stained (M1)</option>
                <option value="M2">Thick Meconium (M2)</option>
                <option value="B">Bloody (B)</option>
              </select>
            </div>
            <div>
              <label className="input-label">Moulding</label>
              <select {...register('moulding', { valueAsNumber: true })} className="form-input">
                <option value={0}>0 - None</option>
                <option value={1}>1 - Sutures apposed</option>
                <option value={2}>2 - Overlapping (reduced)</option>
                <option value={3}>3 - Severely overlapping</option>
              </select>
            </div>
          </div>
        </div>

        {/* Labour Progress */}
        <div className="bento-card border-l-4 border-m-amber">
          <div className="flex items-center gap-2 mb-4 text-m-amber">
            <Activity size={18} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Labour Progress</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Cervical Dilation (cm)</label>
              <input type="number" step="1" {...register('cervicalDilation', { valueAsNumber: true })} className="form-input" />
            </div>
            <div>
              <label className="input-label">Head Descent (fifths)</label>
              <input type="number" step="1" {...register('fetalHeadDescent', { valueAsNumber: true })} className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="input-label">Contr./10m</label>
                <input type="number" {...register('contractionsCount', { valueAsNumber: true })} className="form-input" />
              </div>
              <div>
                <label className="input-label">Dur. (sec)</label>
                <input type="number" {...register('contractionsDuration', { valueAsNumber: true })} className="form-input" />
              </div>
            </div>
          </div>
        </div>

        {/* Maternal Vitals */}
        <div className="bento-card border-l-4 border-m-red">
          <div className="flex items-center gap-2 mb-4 text-m-red">
            <Thermometer size={18} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Maternal Vitals</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="input-label">Systolic</label>
                <input type="number" {...register('systolicBP', { valueAsNumber: true })} className="form-input" />
              </div>
              <div>
                <label className="input-label">Diastolic</label>
                <input type="number" {...register('diastolicBP', { valueAsNumber: true })} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="input-label">Pulse (bpm)</label>
                <input type="number" {...register('pulse', { valueAsNumber: true })} className="form-input" />
              </div>
              <div>
                <label className="input-label">Temp (°C)</label>
                <input type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} className="form-input" />
              </div>
            </div>
          </div>
        </div>

        {/* Treatment / Urine */}
        <div className="bento-card border-l-4 border-slate-400">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Beaker size={18} />
            <h4 className="text-xs font-bold uppercase tracking-widest">Treatment & Urine</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="input-label">Oxytocin (U/L)</label>
              <input type="number" {...register('oxytocinUnits', { valueAsNumber: true })} className="form-input" placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="input-label">Urine Vol (ml)</label>
                <input type="number" {...register('volume', { valueAsNumber: true })} className="form-input" />
              </div>
              <div>
                <label className="input-label">Proteinuria</label>
                <select {...register('proteinuria')} className="form-input">
                  <option value="-">Nil</option>
                  <option value="+">+</option>
                  <option value="++">++</option>
                  <option value="+++">+++</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full h-10 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Save size={16} />}
              Record Observation
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
