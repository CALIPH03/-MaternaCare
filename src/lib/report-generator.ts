import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, Admission, Delivery, Infant, PartographEntry } from '@/src/types';
import { format } from 'date-fns';

export async function generateDischargeReport(
  patient: Patient,
  admission: Admission,
  delivery: Delivery | null,
  infants: Infant[],
  entries: PartographEntry[]
) {
  const doc = new jsPDF() as any;
  
  // Phase 2: Gendered report color legacy
  let primaryColor = [15, 110, 86]; // m-teal
  if (infants.length > 0) {
    if (infants.length > 1) primaryColor = [186, 117, 23]; // Amber/Twins
    else if (infants[0].sex === 'Female') primaryColor = [190, 24, 93]; // Pink/Female
    else if (infants[0].sex === 'Male') primaryColor = [29, 78, 216]; // Blue/Male
  }

  const secondaryColor = [100, 100, 100];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MATERNACARE DISCHARGE SUMMARY', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mbagathi District Hospital • Level 4 Facility • Kenya', 20, 28);
  doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 34);

  // Patient Info section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.text('MATERNAL INFORMATION', 20, 55);
  doc.line(20, 57, 190, 57);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Full Name: ${patient.fullName}`, 20, 65);
  doc.text(`Date of Birth: ${patient.dateOfBirth || 'N/A'}`, 20, 71);
  doc.text(`Age: ${patient.age} years`, 20, 77);
  doc.text(`ID Number: ${patient.idNumber || 'N/A'}`, 120, 65);
  doc.text(`Phone: ${patient.phoneNumber || 'N/A'}`, 120, 71);
  doc.text(`Address: ${patient.address || 'N/A'}`, 120, 77);

  // Admission & Labour section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.text('ADMISSION & LABOUR PROGRESS', 20, 95);
  doc.line(20, 97, 190, 97);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Admitted At: ${format(new Date(admission.admittedAt), 'PPP p')}`, 20, 105);
  doc.text(`Gravida: ${admission.gravida}  Para: ${admission.para}`, 20, 111);
  doc.text(`Weeks Gestation: ${admission.gestationWeeks}`, 120, 105);
  doc.text(`Ward: ${admission.ward}`, 120, 111);

  // Partograph Summary Table
  if (entries.length > 0) {
    const tableData = entries.slice(-5).map(e => [
      format(new Date(e.recordedAt), 'HH:mm'),
      `${e.fetalHeartRate} bpm`,
      `${e.cervicalDilation} cm`,
      `${e.fetalHeadDescent}/5`,
      `${e.systolicBP}/${e.diastolicBP}`
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Time', 'FHR', 'Dilation', 'Descent', 'BP']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor as any },
      margin: { left: 20, right: 20 }
    });
  }

  const deliveryY = entries.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 120;

  // Delivery Outcome
  if (delivery) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.text('DELIVERY OUTCOME', 20, deliveryY);
    doc.line(20, deliveryY + 2, 190, deliveryY + 2);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Delivery Type: ${delivery.deliveryType}`, 20, deliveryY + 10);
    doc.text(`Date/Time: ${format(new Date(delivery.deliveryDateTime), 'PPP p')}`, 20, deliveryY + 16);
    doc.text(`Outcome: ${delivery.outcome}`, 120, deliveryY + 10);
    doc.text(`Blood Loss: ${delivery.bloodLoss} ml`, 120, deliveryY + 16);
    doc.text(`Perineum: ${delivery.perineum}`, 20, deliveryY + 22);
    
    if (delivery.notes) {
      doc.text('Clinical Notes:', 20, deliveryY + 30);
      doc.setFont('helvetica', 'italic');
      doc.text(delivery.notes, 20, deliveryY + 35, { maxWidth: 170 });
      doc.setFont('helvetica', 'normal');
    }
  }

  // Newborn(s) section
  const infantY = (delivery && delivery.notes) ? deliveryY + 50 : (delivery ? deliveryY + 30 : deliveryY);
  if (infants.length > 0) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.text('NEWBORN INFORMATION', 20, infantY);
    doc.line(20, infantY + 2, 190, infantY + 2);

    infants.forEach((infant, i) => {
      const yOffset = infantY + 10 + (i * 25);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Sex: ${infant.sex}`, 20, yOffset);
      doc.text(`Weight: ${infant.weight} kg`, 20, yOffset + 6);
      doc.text(`APGAR: 1m: ${infant.apgar1}, 5m: ${infant.apgar5}`, 120, yOffset);
      doc.text(`Vitamin K: ${infant.vitaminKGiven ? 'Yes' : 'No'}  BCG: ${infant.bcgGiven ? 'Yes' : 'No'}`, 120, yOffset + 6);
    });
  }

  // Authenticity Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 40, 210, 40, 'F');
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('AUTHENTICATED BY MATERNACARE DIGITAL HEALTH SYSTEM', 105, pageHeight - 30, { align: 'center' });
  doc.text('Verify at: verify.maternacare.go.ke/record/' + patient.id.slice(0, 12), 105, pageHeight - 25, { align: 'center' });
  
  const reportId = `MC-${patient.id.slice(0, 6)}-${format(new Date(), 'yyyyMMdd')}`;
  doc.text(`Report ID: ${reportId}`, 105, pageHeight - 15, { align: 'center' });

  // Save the PDF
  doc.save(`Discharge_Summary_${patient.fullName.replace(/\s+/g, '_')}.pdf`);
}
