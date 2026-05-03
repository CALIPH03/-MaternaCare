import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, CheckCircle, LogOut } from 'lucide-react';
import { saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { logAction } from '@/src/lib/audit.ts';
import { useAuthStore } from '@/src/store/useAuthStore.ts';

const deliverySchema = z.object({
  deliveryType: z.string().min(1),
  deliveryDateTime: z.string().min(1),
  placentaDateTime: z.string().min(1),
  outcome: z.string().min(1),
  bloodLoss: z.number().min(0).max(5000),
  perineum: z.string().min(1),
  oxytocinGiven: z.boolean(),
  notes: z.string().optional(),
});

interface Props {
  admissionId: string;
  patientId: string;
  onComplete: () => void;
}

export default function DeliveryForm({ admissionId, patientId, onComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryType: 'SVD',
      outcome: 'Live Birth',
      bloodLoss: 150,
      perineum: 'Intact',
      oxytocinGiven: true,
      deliveryDateTime: new Date().toISOString().slice(0, 16),
      placentaDateTime: new Date().toISOString().slice(0, 16),
    }
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const deliveryId = crypto.randomUUID();
      const deliveryData = {
        id: deliveryId,
        admissionId,
        patientId,
        ...values,
      };

      await saveToLocal('deliveries', deliveryData);
      await addToSyncQueue({ tableName: 'deliveries', operation: 'INSERT', payload: deliveryData });
      
      if (user) {
        await logAction(
          user.id,
          user.name,
          user.role,
          'RECORD_DELIVERY',
          'delivery',
          deliveryId,
          `Recorded ${values.deliveryType} delivery for patient ${patientId}. Outcome: ${values.outcome}`
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
        <div className="w-10 h-10 bg-m-green/10 rounded-full flex items-center justify-center text-m-green">
          <CheckCircle size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Delivery Record</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Outcome Documentation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="input-label">Delivery Type</label>
              <select {...register('deliveryType')} className="form-input">
                <option value="SVD">Spontaneous Vaginal (SVD)</option>
                <option value="Assisted">Assisted Vaginal (Vacuum/Forceps)</option>
                <option value="CS-Emergency">Emergency C-Section</option>
                <option value="CS-Elective">Elective C-Section</option>
                <option value="Breech">Breech Delivery</option>
              </select>
            </div>
            <div>
              <label className="input-label">Outcome</label>
              <select {...register('outcome')} className="form-input">
                <option value="Live Birth">Live Birth</option>
                <option value="Stillbirth-F">Fresh Stillbirth</option>
                <option value="Stillbirth-M">Macerated Stillbirth</option>
              </select>
            </div>
            <div>
              <label className="input-label">Delivery Date/Time</label>
              <input type="datetime-local" {...register('deliveryDateTime')} className="form-input" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="input-label">Estimated Blood Loss (ml)</label>
              <input type="number" {...register('bloodLoss', { valueAsNumber: true })} className="form-input" />
            </div>
            <div>
              <label className="input-label">Perineum Status</label>
              <select {...register('perineum')} className="form-input">
                <option value="Intact">Intact</option>
                <option value="1st Degree">1st Degree Tear</option>
                <option value="2nd Degree">2nd Degree Tear</option>
                <option value="3rd/4th Degree">3rd/4th Degree</option>
                <option value="Episiotomy">Episiotomy</option>
              </select>
            </div>
            <div>
              <label className="input-label">Placenta Delivery Time</label>
              <input type="datetime-local" {...register('placentaDateTime')} className="form-input" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input type="checkbox" {...register('oxytocinGiven')} id="oxytocin" className="w-5 h-5 rounded border-slate-300 text-m-teal focus:ring-m-teal" />
            <label htmlFor="oxytocin" className="text-sm font-bold text-slate-700">Oxytocin 10U IM Given (Active Management)</label>
          </div>
          <span className="text-[10px] bg-m-teal/10 text-m-teal px-2 py-0.5 rounded-full font-bold uppercase italic">WHO RECOMMENDED</span>
        </div>

        <div>
          <label className="input-label">Clinical Notes</label>
          <textarea {...register('notes')} className="form-input h-24 resize-none" placeholder="Any complications, medications given, or additional information..."></textarea>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary flex-1 h-12 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Save size={18} />}
            Finalize Delivery Record
          </button>
        </div>
      </form>
    </div>
  );
}
