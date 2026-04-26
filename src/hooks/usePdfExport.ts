// src/hooks/usePdfExport.ts
import { Mission, MissionData } from '../data/types';
import {
  getWeekDays, getMondayOfWeek, getTodayKey, computeDay,
  minutesToHM, isAbsenceJustifiee, pad, computeMonthStats,
  getMonthsInRange, DAY_TYPES_LABELS,
} from './useTime';

// Dynamically import jsPDF to avoid SSR issues
async function getPdf() {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  return jsPDF;
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function fmtDate(str: string): string {
  const d = new Date(str);
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export async function exportWeeklyPDF(
  mission: Mission,
  data: MissionData,
  mondayStr: string
): Promise<void> {
  const jsPDF = await getPdf();
  const doc = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const accentR = parseInt(mission.accentColor.slice(1, 3), 16);
  const accentG = parseInt(mission.accentColor.slice(3, 5), 16);
  const accentB = parseInt(mission.accentColor.slice(5, 7), 16);

  const weekDays = getWeekDays(mondayStr);
  const friday = weekDays[4];

  // ── Header ──
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(0, 0, 4, 28, 'F');
  doc.setTextColor(230, 237, 243);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MissionTrack — Rapport hebdomadaire', 10, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(139, 148, 158);
  doc.text(`${mission.consultantName} · ${mission.company} → ${mission.client}`, 10, 18);
  doc.text(`Semaine du ${fmtDate(mondayStr)} au ${fmtDate(friday)}`, 10, 24);

  let y = 34;

  // ── Mission info ──
  doc.setTextColor(accentR, accentG, accentB);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MISSION', 10, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Réf: ${mission.reference || '—'}   Période: ${mission.startDate} → ${mission.endDate}   Base: ${mission.weeklyHours}h/semaine`, 10, y);
  y += 8;

  // ── Pointage table ──
  doc.setTextColor(accentR, accentG, accentB);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('POINTAGE HEBDOMADAIRE', 10, y);
  y += 3;

  const rows: any[] = [];
  let totalMins = 0;
  let absenceCount = 0;

  weekDays.forEach((key) => {
    const p = data.pointages[key];
    const type = p?.type || 'work';
    const cfg = (DAY_TYPES_LABELS as any)[type] || { label: type, icon: '' };
    const d = new Date(key);
    const dayLabel = `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;

    if (isAbsenceJustifiee(type as any)) {
      absenceCount++;
      rows.push([dayLabel, cfg.label, '—', '—', '—', cfg.label]);
    } else {
      const computed = computeDay(p);
      if (computed) {
        const t = Math.max(0, computed.travail);
        totalMins += t;
        rows.push([
          dayLabel,
          p?.arrivee || '—',
          p?.depart || '—',
          `${p?.pause || 0} min`,
          minutesToHM(t),
          p?.note || '',
        ]);
      } else {
        rows.push([dayLabel, '—', '—', '—', '—', p?.note || '']);
      }
    }
  });

  (doc as any).autoTable({
    startY: y,
    head: [['Jour', 'Arrivée', 'Départ', 'Pause', 'Temps', 'Note']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [accentR, accentG, accentB], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 38 }, 5: { cellWidth: 50 } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Week summary ──
  doc.setFillColor(240, 244, 248);
  doc.rect(10, y, 190, 10, 'F');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const target = mission.weeklyHours * 60;
  const diff = totalMins - target;
  doc.text(
    `Total semaine : ${minutesToHM(totalMins)}   Objectif : ${mission.weeklyHours}h   Écart : ${diff >= 0 ? '+' : ''}${minutesToHM(Math.abs(diff))}   Absences : ${absenceCount} jour(s)`,
    14, y + 6.5
  );
  y += 16;

  // ── Journal this week ──
  const weekJournal = data.journal.filter(e => e.date >= mondayStr && e.date <= friday);
  if (weekJournal.length > 0) {
    doc.setTextColor(accentR, accentG, accentB);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('JOURNAL DE LA SEMAINE', 10, y);
    y += 3;

    (doc as any).autoTable({
      startY: y,
      head: [['Date', 'Événement', 'Preuve']],
      body: weekJournal.map(e => [fmtDate(e.date), `${e.titre}${e.detail ? '\n' + e.detail : ''}`, e.preuve || '']),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [accentR, accentG, accentB], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 0: { cellWidth: 32 }, 2: { cellWidth: 48 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Conformité ──
  if (y < 240) {
    doc.setTextColor(accentR, accentG, accentB);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFORMITÉ', 10, y);
    y += 3;

    (doc as any).autoTable({
      startY: y,
      head: [['Engagement', 'Statut', 'Preuve']],
      body: mission.conformiteItems.map(item => {
        const status = data.conformite[item.id] || 'nc';
        const label = status === 'ok' ? '✓ Conforme' : status === 'partiel' ? '⚠ Partiel' : '✕ Non conforme';
        return [item.label, label, data.conformite[`${item.id}_note`] || ''];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [accentR, accentG, accentB], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Footer ──
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(13, 17, 23);
  doc.rect(0, pageH - 10, 210, 10, 'F');
  doc.setTextColor(100, 110, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `MissionTrack · ${mission.reference || ''} · Généré le ${new Date().toLocaleDateString('fr-FR')}`,
    10, pageH - 4
  );

  const filename = `rapport_${mission.consultantName.replace(/\s/g,'_')}_S${mondayStr}.pdf`;
  doc.save(filename);
}

export async function exportMonthlyPDF(
  mission: Mission,
  data: MissionData,
  monthKey: string
): Promise<void> {
  const jsPDF = await getPdf();
  const doc = new (jsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const accentR = parseInt(mission.accentColor.slice(1, 3), 16);
  const accentG = parseInt(mission.accentColor.slice(3, 5), 16);
  const accentB = parseInt(mission.accentColor.slice(5, 7), 16);

  const [year, month] = monthKey.split('-').map(Number);
  const monthLabel = `${MONTHS_FR[month - 1]} ${year}`;

  // Header
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(0, 0, 4, 28, 'F');
  doc.setTextColor(230, 237, 243);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`MissionTrack — Rapport mensuel · ${monthLabel}`, 10, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(139, 148, 158);
  doc.text(`${mission.consultantName} · ${mission.company} → ${mission.client}`, 10, 18);
  doc.text(`Base horaire : ${mission.weeklyHours}h/semaine`, 10, 24);

  let y = 34;

  const stats = computeMonthStats(monthKey, data.pointages, mission.weeklyHours);
  const diff = stats.worked - stats.target;

  doc.setFillColor(240, 244, 248);
  doc.rect(10, y, 190, 12, 'F');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Temps travaillé : ${minutesToHM(stats.worked)}   Objectif : ${minutesToHM(stats.target)}   Écart : ${diff >= 0 ? '+' : ''}${minutesToHM(Math.abs(diff))}   Absences : ${stats.absences}j`,
    14, y + 7.5
  );
  y += 18;

  // All days
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows: any[] = [];
  const DAYS_FR_FULL = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`;
    const date = new Date(key);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const p = data.pointages[key];
    const type = p?.type || '';
    const dayLabel = `${DAYS_FR_FULL[dow]} ${d}`;

    if (!p) {
      rows.push([dayLabel, '—', '—', '—', '—', '']);
    } else if (isAbsenceJustifiee(type as any)) {
      const cfg = (DAY_TYPES_LABELS as any)[type] || { label: type };
      rows.push([dayLabel, cfg.label, '—', '—', '—', p.note || '']);
    } else {
      const computed = computeDay(p);
      rows.push([
        dayLabel,
        p.arrivee || '—',
        p.depart || '—',
        `${p.pause || 0}min`,
        computed ? minutesToHM(Math.max(0, computed.travail)) : '—',
        p.note || '',
      ]);
    }
  }

  (doc as any).autoTable({
    startY: y,
    head: [['Jour', 'Arrivée', 'Départ', 'Pause', 'Temps', 'Note']],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [accentR, accentG, accentB], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 0: { cellWidth: 24 }, 5: { cellWidth: 55 } },
  });

  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(13, 17, 23);
  doc.rect(0, pageH - 10, 210, 10, 'F');
  doc.setTextColor(100, 110, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`MissionTrack · ${mission.reference || ''} · Généré le ${new Date().toLocaleDateString('fr-FR')}`, 10, pageH - 4);

  const filename = `rapport_mensuel_${mission.consultantName.replace(/\s/g,'_')}_${monthKey}.pdf`;
  doc.save(filename);
}
