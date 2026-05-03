import { PartographEntry, ClinicalAlert, AlertLevel } from '@/src/types';

export function runWHOAlerts(entries: PartographEntry[]): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (entries.length === 0) return alerts;

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const admission = sortedEntries[0];

  // 1. Fetal Heart Rate Alerts
  if (lastEntry.fetalHeartRate > 160) {
    alerts.push({
      id: crypto.randomUUID(),
      admissionId: lastEntry.admissionId,
      type: 'FHR Tachycardia',
      level: AlertLevel.ALERT,
      message: `FHR is high (${lastEntry.fetalHeartRate} bpm).`,
      recommendation: 'Encourage left lateral position. Assess for maternal fever or dehydration. Recheck FHR in 30 mins.',
      createdAt: new Date().toISOString(),
    });
  } else if (lastEntry.fetalHeartRate < 110) {
    alerts.push({
      id: crypto.randomUUID(),
      admissionId: lastEntry.admissionId,
      type: 'FHR Bradycardia',
      level: AlertLevel.EMERGENCY,
      message: `Critically low FHR (${lastEntry.fetalHeartRate} bpm).`,
      recommendation: 'Immediate clinical review. Administer O2. Start IV fluids. Prepare for possible emergency delivery.',
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Liquor / Meconium Alerts
  if (lastEntry.liquor === 'M2' || lastEntry.liquor === 'B') {
    alerts.push({
      id: crypto.randomUUID(),
      admissionId: lastEntry.admissionId,
      type: 'Abnormal Liquor',
      level: AlertLevel.ALERT,
      message: `Liquor is ${lastEntry.liquor === 'M2' ? 'Thick Meconium' : 'Bloody'}.`,
      recommendation: 'High risk of fetal distress. Continuous monitoring of FHR required.',
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Maternal Blood Pressure
  if (lastEntry.systolicBP >= 160 || lastEntry.diastolicBP >= 110) {
    alerts.push({
      id: crypto.randomUUID(),
      admissionId: lastEntry.admissionId,
      type: 'Severe Hypertension',
      level: AlertLevel.EMERGENCY,
      message: `Critical BP detected: ${lastEntry.systolicBP}/${lastEntry.diastolicBP}.`,
      recommendation: 'Risk of Eclampsia. Immediate administration of Magnesium Sulfate and antihypertensives as per protocol.',
      createdAt: new Date().toISOString(),
    });
  } else if (lastEntry.systolicBP >= 140 || lastEntry.diastolicBP >= 90) {
    alerts.push({
      id: crypto.randomUUID(),
      admissionId: lastEntry.admissionId,
      type: 'Hypertension',
      level: AlertLevel.ALERT,
      message: `Elevated BP: ${lastEntry.systolicBP}/${lastEntry.diastolicBP}.`,
      recommendation: 'Monitor BP every 15-30 mins. Check for proteinuria. Assess for signs of pre-eclampsia (headache, blurred vision).',
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Labour Progress (Rule-based Cervicogram)
  // Alert line starts at 3cm at hour 0. Expected progress is 1cm/hr.
  if (sortedEntries.length > 1) {
    const firstExam = sortedEntries[0];
    const hoursSinceAdmission = (new Date(lastEntry.recordedAt).getTime() - new Date(firstExam.recordedAt).getTime()) / (1000 * 60 * 60);
    const expectedDilation = firstExam.cervicalDilation + hoursSinceAdmission;
    
    if (lastEntry.cervicalDilation < expectedDilation) {
      alerts.push({
        id: crypto.randomUUID(),
        admissionId: lastEntry.admissionId,
        type: 'Slow Progress',
        level: AlertLevel.WATCH,
        message: 'Cervical dilation is behind the WHO expected rate.',
        recommendation: 'Encourage mobilization. Ensure adequate hydration. Re-examine in 2-4 hours.',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return alerts;
}
