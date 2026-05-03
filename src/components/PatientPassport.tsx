import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Patient, Admission } from '@/src/types';
import { ShieldCheck, Download, Share2, ChevronLeft, Calendar, User } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  patient: Patient;
  admission: Admission;
  onClose: () => void;
}

export default function PatientPassport({ patient, admission, onClose }: Props) {
  // In a real app, this URL would point to a secure verified view
  const verificationUrl = `https://verify.maternacare.go.ke/record/${patient.id}`;

  return (
    <div className="bento-card max-w-md mx-auto text-center p-8 bg-gradient-to-b from-white to-m-teal/5">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-m-teal" size={18} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Verified Record</span>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-m-teal/10 rounded-3xl flex items-center justify-center text-m-teal mb-4">
          <User size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{patient.fullName}</h3>
        <p className="text-sm text-slate-500 font-medium">Digital Maternal Patient Passport</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-m-teal/10 border border-m-teal/10 mb-8 inline-block">
        <QRCodeSVG 
          value={verificationUrl} 
          size={180} 
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/maternacare-icon.png",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 text-left">
        <div className="p-3 bg-slate-50 rounded-2xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Clinic ID</p>
          <p className="text-xs font-bold text-slate-700">{patient.idNumber || patient.id.slice(0, 8)}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Admitted</p>
          <p className="text-xs font-bold text-slate-700">{new Date(admission.admittedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <button className="btn-primary w-full py-4 flex items-center justify-center gap-2">
          <Download size={18} />
          Save to Phone
        </button>
        <button className="btn-secondary w-full py-4 flex items-center justify-center gap-2">
          <Share2 size={18} />
          Share with Facility
        </button>
      </div>

      <p className="mt-8 text-[9px] text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto italic">
        Scan this code at any MaternaCare partner facility to retrieve encrypted clinical records.
      </p>
    </div>
  );
}
