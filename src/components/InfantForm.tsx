import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Baby, ShieldAlert, Save } from 'lucide-react';
import { saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { logAction } from '@/src/lib/audit.ts';
import { useAuthStore } from '@/src/store/useAuthStore.ts';

const infantSchema = z.object({
  fullName: z.string().optional(),
  sex: z.string().min(1),
  weight: z.number().min(0.5).max(8),
  length: z.number().optional(),
  apgar1: z.number().min(0).max(10),
  apgar5: z.number().min(0).max(10),
  apgar10: z.number().optional(),
  resuscitationRequired: z.boolean(),
  bcgGiven: z.boolean(),
  polioGiven: z.boolean(),
  vitaminKGiven: z.boolean(),
  notes: z.string().optional(),
});

interface Props {
  admissionId: string;
  patientId: string;
  onComplete: () => void;
}

export default function InfantForm({ admissionId, patientId, onComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(infantSchema),
    defaultValues: {
      sex: 'Male',
      weight: 3.2,
      apgar1: 9,
      apgar5: 10,
      resuscitationRequired: false,
      bcgGiven: false,
      polioGiven: false,
      vitaminKGiven: true,
    }
  });

  const apgar1 = watch('apgar1');
  const apgar5 = watch('apgar5');

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const infantId = crypto.randomUUID();
      const infantData = {
        id: infantId,
        motherId: patientId,
        admissionId,
        recordedAt: new Date().toISOString(),
        ...values,
      };

      await saveToLocal('infants', infantData);
      await addToSyncQueue({ tableName: 'infants', operation: 'INSERT', payload: infantData });
      
      if (user) {
        await logAction(
          user.id,
          user.name,
          user.role,
          'REGISTER_INFANT',
          'infant',
          infantId,
          `Registered ${values.sex} infant for mother ${patientId}. Weight: ${values.weight}kg, APGAR: ${values.apgar1}/${values.apgar5}`
        );
      }

      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bento-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-m-teal/10 rounded-full flex items-center justify-center text-m-teal">
          <Baby size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Newborn Registration</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Infant Record & APGAR Score</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="input-label">Sex</label>
              <select {...register('sex')} className="form-input">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Ambiguous">Ambiguous</option>
              </select>
            </div>
            <div>
              <label className="input-label">Weight (kg)</label>
              <input type="number" step="0.01" {...register('weight', { valueAsNumber: true })} className="form-input" />
            </div>
            {(apgar1 < 7 || apgar5 < 7) && (
              <div className="p-3 bg-m-red/5 border border-m-red/20 rounded-xl flex items-start gap-2">
                <ShieldAlert size={14} className="text-m-red mt-0.5" />
                <p className="text-[10px] font-bold text-m-red uppercase tracking-tight">Low APGAR detected. Ensure neonatal review.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">APGAR Scores</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">1 Minute</label>
                  <input type="number" {...register('apgar1', { valueAsNumber: true })} className="form-input w-20 text-center" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">5 Minutes</label>
                  <input type="number" {...register('apgar5', { valueAsNumber: true })} className="form-input w-20 text-center" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">10 Minutes</label>
                  <input type="number" {...register('apgar10', { valueAsNumber: true })} className="form-input w-20 text-center" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Prophylaxis & Safety</h4>
            <div className="space-y-2">
              <ToggleRow label="Resuscitation Required" {...register('resuscitationRequired')} />
              <ToggleRow label="Vitamin K Given" {...register('vitaminKGiven')} />
              <ToggleRow label="Polio (OPV0) Given" {...register('polioGiven')} />
              <ToggleRow label="BCG Given" {...register('bcgGiven')} />
            </div>
          </div>
        </div>

        <div>
          <label className="input-label">Notes / Defects / Observations</label>
          <textarea {...register('notes')} className="form-input h-20 resize-none"></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full h-12 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <UserPlus size={18} />}
          Register Newborn Entry
        </button>
      </form>
    </div>
  );
}

const ToggleRow = React.forwardRef(({ label, ...props }: any, ref: any) => (
  <div className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    <input 
      type="checkbox" 
      ref={ref} 
      {...props} 
      className="w-5 h-5 rounded border-slate-300 text-m-teal focus:ring-m-teal" 
    />
  </div>
));
ToggleRow.displayName = 'ToggleRow';
