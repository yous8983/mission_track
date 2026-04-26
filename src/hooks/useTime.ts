// src/hooks/useTime.ts
import { Pointage, DayType, JOURS_FERIES } from '../data/types';

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function timeToMinutes(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHM(mins: number): string {
  if (mins < 0) return `−${pad(Math.floor(Math.abs(mins) / 60))}h${pad(Math.abs(mins) % 60)}`;
  return `${Math.floor(mins / 60)}h${pad(mins % 60)}`;
}

export function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayKey(): string {
  return getDayKey(new Date());
}

export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return getDayKey(d);
}

export function getWeekDays(mondayStr: string): string[] {
  const days: string[] = [];
  const base = new Date(mondayStr);
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(getDayKey(d));
  }
  return days;
}

export function isFerie(dateStr: string): boolean {
  return JOURS_FERIES.includes(dateStr);
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_SHORT = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];

export function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export interface ComputedDay {
  travail: number;
  arriveeMin: number;
  departMin: number;
  pause: number;
}

export function computeDay(p?: Pointage): ComputedDay | null {
  if (!p) return null;
  const arr = timeToMinutes(p.arrivee);
  const dep = timeToMinutes(p.depart);
  if (arr == null || dep == null) return null;
  const pause = p.pause ? parseInt(p.pause, 10) : 0;
  return { travail: dep - arr - pause, arriveeMin: arr, departMin: dep, pause };
}

export function isAbsenceJustifiee(type?: DayType): boolean {
  return type === 'cp' || type === 'rtt' || type === 'sick' || type === 'holiday';
}

export function weekIsComplete(days: string[], pointages: Record<string, Pointage>): boolean {
  return days.every(d => {
    const p = pointages[d];
    if (!p) return false;
    if (isAbsenceJustifiee(p.type)) return true;
    if (isFerie(d)) return true;
    return computeDay(p) !== null;
  });
}

// Compute CP/RTT usage from pointages
export function computeAbsenceBalances(pointages: Record<string, Pointage>, cpInitial: number, rttInitial: number) {
  let cpUsed = 0;
  let rttUsed = 0;
  Object.values(pointages).forEach(p => {
    if (p.type === 'cp') cpUsed++;
    if (p.type === 'rtt') rttUsed++;
  });
  return {
    cpUsed,
    rttUsed,
    cpRemaining: cpInitial - cpUsed,
    rttRemaining: rttInitial - rttUsed,
  };
}

// Get all weeks (monday keys) between two dates
export function getWeeksInRange(startDate: string, endDate: string): string[] {
  const weeks: string[] = [];
  const start = new Date(getMondayOfWeek(startDate));
  const end = new Date(endDate);
  let cur = new Date(start);
  while (cur <= end) {
    weeks.push(getDayKey(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}

// Get all months (YYYY-MM) between two dates
export function getMonthsInRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  let cur = new Date(s.getFullYear(), s.getMonth(), 1);
  while (cur <= e) {
    months.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

// Compute hours worked for a given month (YYYY-MM)
export function computeMonthStats(
  monthKey: string,
  pointages: Record<string, Pointage>,
  weeklyHours: number
): { worked: number; target: number; absences: number; label: string } {
  const [year, month] = monthKey.split('-').map(Number);
  const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const label = `${MONTHS_SHORT[month - 1]} ${year}`;

  let worked = 0;
  let absences = 0;
  let workDays = 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`;
    const date = new Date(key);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    if (JOURS_FERIES.includes(key)) continue;
    workDays++;
    const p = pointages[key];
    if (!p) continue;
    if (isAbsenceJustifiee(p.type)) { absences++; continue; }
    const r = computeDay(p);
    if (r) worked += Math.max(0, r.travail);
  }

  const dailyTarget = (weeklyHours * 60) / 5;
  const target = workDays * dailyTarget;
  return { worked, target, absences, label };
}

// Simple label map for PDF export (avoids importing Ionic-specific DAY_TYPES)
export const DAY_TYPES_LABELS: Record<string, { label: string; icon: string }> = {
  work:    { label: 'Travaillé',     icon: '💼' },
  remote:  { label: 'Télétravail',   icon: '🏠' },
  cp:      { label: 'Congé payé',    icon: '🌴' },
  rtt:     { label: 'RTT',           icon: '⏰' },
  sick:    { label: 'Maladie',       icon: '🤒' },
  holiday: { label: 'Jour férié',    icon: '🎉' },
  off:     { label: 'Non travaillé', icon: '—'  },
};
