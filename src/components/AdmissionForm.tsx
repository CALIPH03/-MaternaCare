import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, UserPlus, ClipboardCheck, ChevronRight, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { logAction } from '@/src/lib/audit.ts';
import { useAuthStore } from '@/src/store/useAuthStore.ts';

const admissionSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.coerce.number().min(12, "Age must be at least 12").max(60, "Age must be below 60"),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().min(3, "Contact name is required"),
  emergencyContactPhone: z.string().min(10, "Valid phone number required"),
  address: z.string().optional(),
  // Obstetric History
  gravida: z.coerce.number().min(1),
  para: z.coerce.number().min(0),
  gestationWeeks: z.coerce.number().min(20).max(45),
  ward: z.string().min(1, "Ward is required"),
  consentCaptured: z.boolean().refine(val => val === true, "KDPA Consent is mandatory"),
});

export type AdmissionFormData = z.infer<typeof admissionSchema>;

export default function AdmissionForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      consentCaptured: false,
      gravida: 1,
      para: 0,
      gestationWeeks: 38,
      ward: 'Labour Ward',
      fullName: '',
      age: 20,
      idNumber: '',
      phoneNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      address: '',
      dateOfBirth: '',
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const patientId = crypto.randomUUID();
      const facilityId = (process.env as any).NEXT_PUBLIC_FACILITY_ID || 'facility-1';
      const patientData = {
        id: patientId,
        facilityId,
        fullName: data.fullName,
        idNumber: data.idNumber,
        age: data.age,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        consentCaptured: true,
        consentTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const admissionData = {
        id: crypto.randomUUID(),
        patientId,
        facilityId,
        admissionNumber: `ADM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        admittedAt: new Date().toISOString(),
        ward: data.ward,
        gravida: data.gravida,
        para: data.para,
        gestationWeeks: data.gestationWeeks,
        status: 'active' as const,
      };

      // Offline-first persistence
      await saveToLocal('patients', patientData);
      await saveToLocal('admissions', admissionData);
      
      await addToSyncQueue({ tableName: 'patients', operation: 'INSERT', payload: patientData });
      await addToSyncQueue({ tableName: 'admissions', operation: 'INSERT', payload: admissionData });

      if (user) {
        await logAction(
          user.id,
          user.name,
          user.role,
          'ADMIT_PATIENT',
          'patient',
          patientId,
          `Admitted patient ${data.fullName} to ${data.ward}`
        );
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-m-green/20 text-m-green rounded-full flex items-center justify-center mb-4">
          <ClipboardCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Admitted Successfully</h2>
        <p className="text-slate-500 mb-6">The admission record has been saved locally and queued for synchronization.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Admit Another Patient
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-m-teal/10 text-m-teal rounded-xl">
          <UserPlus size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Admission</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">WHO Labour Care Guide • Preliminary Intake</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Step 1: Personal Details */}
        <div className="md:col-span-7 bento-card bento-card-identity">
          <div className="bento-card-header">
            <User size={18} className="text-m-teal" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0">1. Personal Identity</h3>
            <span className="ml-auto badge badge-teal">Required</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <label className="form-label">Full Name</label>
              <input {...register('fullName')} className="form-input" placeholder="e.g., Mary Wanjiru" />
              {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="form-label">Age</label>
              <input {...register('age')} type="number" className="form-input" />
              {errors.age && <p className="form-error">{errors.age.message}</p>}
            </div>

            <div>
              <label className="form-label">ID / Passport (Optional)</label>
              <input {...register('idNumber')} className="form-input" />
            </div>

            <div className="col-span-2">
              <label className="form-label">Phone Number</label>
              <input {...register('phoneNumber')} className="form-input" placeholder="+254..." />
            </div>
          </div>
        </div>

        {/* Step 2: Obstetric Summary */}
        <div className="md:col-span-5 bento-card">
          <div className="bento-card-header">
            <Activity size={18} className="text-m-indigo" />
            <h3 className="bento-card-title mb-0">2. Obstetric Summary</h3>
          </div>
          
          <div className="space-y-4 mt-2">
            <div>
              <label className="form-label">Admission Ward</label>
              <select {...register('ward')} className="form-input">
                <option value="Labour Ward">Labour Ward</option>
                <option value="Antenatal Ward">Antenatal Ward</option>
                <option value="Triage / Observation">Triage / Observation</option>
              </select>
              {errors.ward && <p className="form-error">{errors.ward.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">G</label>
                <input {...register('gravida')} type="number" className="form-input text-center" />
              </div>
              <div>
                <label className="form-label">P</label>
                <input {...register('para')} type="number" className="form-input text-center" />
              </div>
              <div>
                <label className="form-label">GA (Wks)</label>
                <input {...register('gestationWeeks')} type="number" className="form-input text-center" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Emergency & Consent */}
        <div className="md:col-span-8 bento-card">
          <div className="bento-card-header">
            <ClipboardCheck size={18} className="text-m-green" />
            <h3 className="bento-card-title mb-0">3. Emergency Contact & Consent</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="form-label">Primary Contact Name</label>
              <input {...register('emergencyContactName')} className="form-input" />
              {errors.emergencyContactName && <p className="form-error">{errors.emergencyContactName.message}</p>}
            </div>
            <div>
              <label className="form-label">Primary Contact Phone</label>
              <input {...register('emergencyContactPhone')} className="form-input" />
              {errors.emergencyContactPhone && <p className="form-error">{errors.emergencyContactPhone.message}</p>}
            </div>
          </div>

          <div className="mt-6 p-4 bg-m-amber/5 border border-m-amber/10 rounded-xl flex items-start gap-3">
             <input {...register('consentCaptured')} type="checkbox" className="mt-1 w-4 h-4 rounded border-m-amber text-m-amber focus:ring-m-amber" />
             <div className="text-xs">
               <span className="font-bold text-m-amber uppercase tracking-widest block mb-1">KDPA 2019 Consent Required</span>
               <p className="text-slate-600 leading-relaxed font-medium">I verify that informed consent has been captured for digital processing of clinical obstetric data under Kenyan law.</p>
               {errors.consentCaptured && <p className="form-error">{errors.consentCaptured.message}</p>}
             </div>
          </div>
        </div>

        {/* Final Action */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bento-card bg-slate-900 border-t-4 border-m-amber flex-1 flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-m-amber uppercase tracking-widest mb-2 italic">Data Resididency</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Records will be stored in <span className="text-slate-200">AWS-af-south-1</span> Cape Town region to ensure compliance with Kenya patient privacy protocols.
            </p>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary w-full h-16 text-lg justify-center shadow-lg shadow-m-teal/20"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={24} />
                Confirm Admission
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
