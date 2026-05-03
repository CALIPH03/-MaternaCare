import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Truck, ShieldAlert, Send, FileText, ChevronLeft } from 'lucide-react';
import { saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { logAction } from '@/src/lib/audit.ts';
import { useAuthStore } from '@/src/store/useAuthStore.ts';
import { Patient, Admission, PartographEntry } from '@/src/types';

const referralSchema = z.object({
  vicarialFacilityName: z.string().min(1, "Destination facility is required"),
  referralReason: z.string().min(10, "Please provide more detail"),
  clinicalSummary: z.string().min(20, "Summary is required for continuity of care"),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  transportMode: z.string().min(1),
});

interface Props {
  patient: Patient;
  admission: Admission;
  entries: PartographEntry[];
  onComplete: () => void;
  onCancel: () => void;
}

export default function ReferralForm({ patient, admission, entries, onComplete, onCancel }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const lastEntry = entries[entries.length - 1];
  const defaultSummary = `Patient ${patient.fullName}, Gravida ${admission.gravida} Para ${admission.para}, admitted at ${new Date(admission.admittedAt).toLocaleString()}. Current dilation: ${lastEntry?.cervicalDilation || 'N/A'}cm. FHR: ${lastEntry?.fetalHeartRate || 'N/A'} bpm. BP: ${lastEntry?.systolicBP}/${lastEntry?.diastolicBP}.`;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      urgency: 'emergency',
      transportMode: 'Ambulance',
      clinicalSummary: defaultSummary,
    }
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const referralId = crypto.randomUUID();
      const referralData = {
        id: referralId,
        admissionId: admission.id,
        patientId: patient.id,
        facilityId: admission.facilityId,
        referredAt: new Date().toISOString(),
        referredBy: user?.id || 'unknown',
        status: 'pending' as const,
        ...values,
      };

      // Save referral
      await saveToLocal('referrals', referralData);
      await addToSyncQueue({ tableName: 'referrals', operation: 'INSERT', payload: referralData });

      // Update admission status to transferred
      const updatedAdmission = { ...admission, status: 'transferred' as const };
      await saveToLocal('admissions', updatedAdmission);
      await addToSyncQueue({ tableName: 'admissions', operation: 'UPDATE', payload: updatedAdmission });

      if (user) {
        await logAction(
          user.id,
          user.name,
          user.role,
          'INITIATE_REFERRAL',
          'referral',
          referralId,
          `Initiated emergency referral for ${patient.fullName} to ${values.vicarialFacilityName}`
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
    <div className="bento-card max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-m-red/10 rounded-full flex items-center justify-center text-m-red">
          <Truck size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Secondary Referral Form</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Emergency Transfer Coordination</p>
        </div>
      </div>

      <div className="p-4 bg-m-red/5 border border-m-red/20 rounded-2xl mb-6 flex items-start gap-3">
        <ShieldAlert size={18} className="text-m-red shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-m-red uppercase tracking-tight">Active Warning</p>
          <p className="text-xs text-slate-600 font-medium">Ensure vital signs are stabilized before transport. Oxygen and IV access should be maintained.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="input-label">Destination Facility</label>
            <select {...register('vicarialFacilityName')} className="form-input">
              <option value="">Select Hospital...</option>
              <option value="Kenyatta National Hospital">Kenyatta National Hospital (Level 6)</option>
              <option value="Pumwani Maternity Hospital">Pumwani Maternity (Specialized)</option>
              <option value="Mama Lucy Kibaki Hospital">Mama Lucy Kibaki (Level 5)</option>
              <option value="Mbagathi Regional Referral">Mbagathi Regional Referral</option>
            </select>
            {errors.vicarialFacilityName && <p className="text-[10px] text-m-red mt-1 font-bold">{errors.vicarialFacilityName.message as string}</p>}
          </div>

          <div>
            <label className="input-label">Urgency Level</label>
            <select {...register('urgency')} className="form-input">
              <option value="routine">Routine / Staged</option>
              <option value="urgent">Urgent Coordination</option>
              <option value="emergency">Life Threatening Emergency</option>
            </select>
          </div>
        </div>

        <div>
          <label className="input-label">Primary Reason for Referral</label>
          <textarea 
            {...register('referralReason')} 
            className="form-input h-20" 
            placeholder="e.g. Fetal distress detected, Alert line breach, Massive PPH..."
          ></textarea>
        </div>

        <div>
          <label className="input-label">Clinical Transfer Summary (WHO Format)</label>
          <textarea 
            {...register('clinicalSummary')} 
            className="form-input h-32 text-xs font-mono" 
          ></textarea>
          <p className="text-[10px] text-slate-400 mt-2 italic">* Pre-populated from latest Partograph observations</p>
        </div>

        <div>
          <label className="input-label">Transport Means</label>
          <div className="grid grid-cols-3 gap-3">
            {['Ambulance', 'Private', 'Other'].map(mode => (
              <label key={mode} className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="radio" value={mode} {...register('transportMode')} className="w-4 h-4 text-m-teal" />
                <span className="text-xs font-bold text-slate-700">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full h-14 bg-m-red hover:bg-m-red/90 flex items-center justify-center gap-2 shadow-m-red/20 shadow-lg text-lg"
        >
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Send size={20} />}
          Authorize Transfer & Send Alert
        </button>
      </form>
    </div>
  );
}
