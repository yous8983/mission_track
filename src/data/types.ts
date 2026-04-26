// src/data/types.ts

export type DayType = 'work' | 'cp' | 'rtt' | 'sick' | 'remote' | 'holiday' | 'off';

export interface DayConfig {
  type: DayType;
  label: string;
  color: string;
  icon: string;
  countsAsAbsence: boolean;
  deductsBalance: 'cp' | 'rtt' | null;
}

export const DAY_TYPES: Record<DayType, DayConfig> = {
  work:    { type: 'work',    label: 'Travaillé',     color: '#3fb950', icon: '💼', countsAsAbsence: false, deductsBalance: null },
  remote:  { type: 'remote',  label: 'Télétravail',   color: '#58a6ff', icon: '🏠', countsAsAbsence: false, deductsBalance: null },
  cp:      { type: 'cp',      label: 'Congé payé',    color: '#d29922', icon: '🌴', countsAsAbsence: true,  deductsBalance: 'cp' },
  rtt:     { type: 'rtt',     label: 'RTT',           color: '#a371f7', icon: '⏰', countsAsAbsence: true,  deductsBalance: 'rtt' },
  sick:    { type: 'sick',    label: 'Maladie',       color: '#f85149', icon: '🤒', countsAsAbsence: true,  deductsBalance: null },
  holiday: { type: 'holiday', label: 'Jour férié',    color: '#8b949e', icon: '🎉', countsAsAbsence: false, deductsBalance: null },
  off:     { type: 'off',     label: 'Non travaillé', color: '#484f58', icon: '—',  countsAsAbsence: false, deductsBalance: null },
};

export interface Pointage {
  type: DayType;
  arrivee?: string;
  depart?: string;
  pause?: string;
  note?: string;
}

export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'blocked';

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  todo:       { label: 'À faire',     color: '#8b949e', icon: '○' },
  inprogress: { label: 'En cours',    color: '#58a6ff', icon: '◑' },
  done:       { label: 'Terminé',     color: '#3fb950', icon: '●' },
  blocked:    { label: 'Bloqué',      color: '#f85149', icon: '✕' },
};

export type TaskPriority = 'low' | 'medium' | 'high';

export const TASK_PRIORITY: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: 'Basse',  color: '#484f58' },
  medium: { label: 'Moyenne', color: '#d29922' },
  high:   { label: 'Haute',  color: '#f85149' },
};

export interface Task {
  id: number;
  titre: string;
  description?: string;
  statut: TaskStatus;
  priorite: TaskPriority;
  echeance?: string;
  categorie?: string;
  createdAt: string;
}

export interface ConformiteItem {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

export const DEFAULT_CONFORMITE_ITEMS: ConformiteItem[] = [
  { id: 'conf',  label: 'Confidentialité',        desc: 'Secret professionnel et non-divulgation',           icon: 'lock-closed-outline',      color: '#58a6ff' },
  { id: 'secu',  label: 'Sécurité Informatique',  desc: 'Respect de la charte sécurité et protection accès', icon: 'shield-checkmark-outline', color: '#3fb950' },
  { id: 'rgpd',  label: 'RGPD',                   desc: 'Règlement UE 2016/679 — collecte, traitement et protection des données personnelles',         icon: 'document-text-outline',    color: '#d29922' },
  { id: 'sante', label: 'Santé & Sécurité',       desc: 'Plan de prévention et consignes sur site',           icon: 'medkit-outline',           color: '#f85149' },
];

export interface JournalEntry {
  id: number;
  date: string;
  titre: string;
  detail?: string;
  preuve?: string;
}

export interface Contact {
  role: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Mission {
  id: string;
  consultantName: string;
  company: string;
  client: string;
  reference: string;
  startDate: string;
  endDate: string;
  weeklyHours: number;
  cpBalance: number;
  rttBalance: number;
  description?: string;
  conformiteItems: ConformiteItem[];
  contacts: Contact[];
  accentColor: string;
}

export interface MissionData {
  pointages: Record<string, Pointage>;
  conformite: Record<string, string>;
  journal: JournalEntry[];
  tasks: Task[];
}

export interface AppState {
  missions: Mission[];
  missionData: Record<string, MissionData>;
  activeMissionId: string | null;
}

export const JOURS_FERIES: string[] = [
  "2026-01-01","2026-04-06","2026-05-01","2026-05-08",
  "2026-05-14","2026-05-25","2026-07-14","2026-08-15",
  "2026-11-01","2026-11-11","2026-12-25",
  "2027-01-01","2027-03-29","2027-05-01","2027-05-08",
  "2027-05-06","2027-05-17","2027-07-14","2027-08-15",
  "2027-11-01","2027-11-11","2027-12-25",
];

export const ACCENT_COLORS = [
  '#1f6feb','#3fb950','#d29922','#f85149',
  '#a371f7','#58a6ff','#ffa657','#39d353',
];
