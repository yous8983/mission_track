// src/pages/PointagePage.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonCard, IonCardContent, IonBadge, IonChip,
} from '@ionic/react';
import {
  chevronBackOutline, chevronForwardOutline,
  warningOutline, checkmarkCircleOutline,
} from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import {
  getDayKey, getTodayKey, getWeekDays, computeDay,
  formatDateFR, minutesToHM, getMondayOfWeek, isFerie,
  computeAbsenceBalances, isAbsenceJustifiee,
} from '../hooks/useTime';
import { DAY_TYPES, DayType, Pointage } from '../data/types';
import { EmptyState } from '../components/EmptyState';
import './PointagePage.css';

const DAYS_LABEL = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const WORK_TYPES: DayType[] = ['work', 'remote', 'cp', 'rtt', 'sick', 'holiday', 'off'];

export const PointagePage: React.FC = () => {
  const { activeMission, activeData, updatePointage } = useApp();
  const today = getTodayKey();
  const [selectedMonday, setSelectedMonday] = useState(() => getMondayOfWeek(today));

  const weekDays = getWeekDays(selectedMonday);
  const pointages = activeData.pointages;

  function prevWeek() {
    const d = new Date(selectedMonday); d.setDate(d.getDate() - 7); setSelectedMonday(getDayKey(d));
  }
  function nextWeek() {
    const d = new Date(selectedMonday); d.setDate(d.getDate() + 7); setSelectedMonday(getDayKey(d));
  }

  function setType(key: string, type: DayType) {
    updatePointage(key, { type });
  }
  function setField(key: string, field: keyof Pointage, val: string) {
    updatePointage(key, { [field]: val });
  }

  const targetMins = (activeMission?.weeklyHours || 35) * 60;

  // Week total (only work/remote days)
  const weekTotal = weekDays.reduce((acc, k) => {
    const p = pointages[k];
    if (!p || isAbsenceJustifiee(p.type)) return acc;
    const r = computeDay(p);
    return acc + (r ? Math.max(0, r.travail) : 0);
  }, 0);

  // Count absences this week
  const cpThisWeek = weekDays.filter(k => pointages[k]?.type === 'cp').length;
  const rttThisWeek = weekDays.filter(k => pointages[k]?.type === 'rtt').length;
  const sickThisWeek = weekDays.filter(k => pointages[k]?.type === 'sick').length;
  const workDays = weekDays.filter(k => {
    const p = pointages[k];
    return !p || p.type === 'work' || p.type === 'remote';
  }).length;

  // Repos alerts
  const reposAlerts: string[] = [];
  for (let i = 0; i < weekDays.length - 1; i++) {
    const a = pointages[weekDays[i]];
    const b = pointages[weekDays[i + 1]];
    const ra = computeDay(a);
    const rb = computeDay(b);
    if (ra && rb) {
      const repos = (rb.arriveeMin + 24 * 60) - ra.departMin;
      if (repos < 11 * 60) {
        reposAlerts.push(`${formatDateFR(weekDays[i])} → ${formatDateFR(weekDays[i+1])}: ${Math.round(repos/60)}h`);
      }
    }
  }

  const weekHasAbsence = cpThisWeek > 0 || rttThisWeek > 0 || sickThisWeek > 0;
  const balances = activeMission
    ? computeAbsenceBalances(pointages, activeMission.cpBalance, activeMission.rttBalance)
    : null;

  const mondayDate = new Date(selectedMonday);
  const fridayDate = new Date(selectedMonday); fridayDate.setDate(mondayDate.getDate() + 4);
  const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
  const weekLabel = `${mondayDate.getDate()} ${MONTHS[mondayDate.getMonth()]} — ${fridayDate.getDate()} ${MONTHS[fridayDate.getMonth()]} ${fridayDate.getFullYear()}`;

  if (!activeMission) {
    return <EmptyState title="Pointage" message="Créez une mission" icon="⏱" />;
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar style={{ '--background': 'var(--mt-surface)' }}>
          <IonTitle>
            <span style={{ fontSize: 14 }}>⏱ {activeMission.company}</span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="pointage-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Pointage</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Balances bar */}
        {balances && (
          <div className="balances-bar">
            <div className="balance-item">
              <span className="balance-val" style={{ color: 'var(--mt-orange)' }}>{balances.cpRemaining}j</span>
              <span className="balance-lbl">CP restants</span>
            </div>
            <div className="balance-sep" />
            <div className="balance-item">
              <span className="balance-val" style={{ color: 'var(--mt-purple)' }}>{balances.rttRemaining}j</span>
              <span className="balance-lbl">RTT restants</span>
            </div>
            <div className="balance-sep" />
            <div className="balance-item">
              <span className="balance-val" style={{ color: 'var(--mt-red)' }}>{balances.cpUsed + balances.rttUsed}j</span>
              <span className="balance-lbl">Absences posées</span>
            </div>
          </div>
        )}

        {/* Week nav */}
        <div className="week-nav">
          <IonButton fill="clear" onClick={prevWeek}>
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <div className="week-label">{weekLabel}</div>
          <IonButton fill="clear" onClick={nextWeek}>
            <IonIcon icon={chevronForwardOutline} />
          </IonButton>
        </div>

        {/* Summary */}
        <IonCard className={`summary-card ${weekHasAbsence ? 'has-absence' : weekTotal >= targetMins ? 'ok' : 'warn'}`}>
          <IonCardContent>
            <div className="summary-row">
              <div>
                <div className="summary-sublabel">Temps travaillé</div>
                <div className={`summary-total ${weekTotal >= targetMins || weekHasAbsence ? 'color-ok' : 'color-warn'}`}>
                  {minutesToHM(weekTotal)}
                </div>
                <div className="summary-target">Objectif : {activeMission.weeklyHours}h00</div>
                {weekHasAbsence && (
                  <div className="absence-chips">
                    {cpThisWeek > 0 && <span className="chip-cp">{cpThisWeek}j CP</span>}
                    {rttThisWeek > 0 && <span className="chip-rtt">{rttThisWeek}j RTT</span>}
                    {sickThisWeek > 0 && <span className="chip-sick">{sickThisWeek}j Maladie</span>}
                  </div>
                )}
              </div>
              <div className="summary-right">
                {reposAlerts.length === 0 ? (
                  <IonBadge color="success">
                    <IonIcon icon={checkmarkCircleOutline} /> Repos OK
                  </IonBadge>
                ) : (
                  reposAlerts.map((a, i) => (
                    <div key={i} className="repos-alert">
                      <IonIcon icon={warningOutline} /> {a}
                    </div>
                  ))
                )}
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Day cards */}
        {weekDays.map((key, i) => {
          const ferieDay = isFerie(key);
          const isToday = key === today;
          const p = pointages[key] || { type: ferieDay ? 'holiday' : 'work' };
          const dayType = p.type || (ferieDay ? 'holiday' : 'work');
          const cfg = DAY_TYPES[dayType];
          const computed = computeDay(p);
          const isWorked = dayType === 'work' || dayType === 'remote';
          const isAbsence = isAbsenceJustifiee(dayType);

          return (
            <IonCard key={key} className={`day-card ${isToday ? 'today' : ''}`}
              style={{ borderLeftColor: cfg.color }}>
              <IonCardContent>
                <div className="day-header">
                  <div className="day-title-row">
                    <span className="day-name">{DAYS_LABEL[i]} {new Date(key).getDate()}</span>
                    {isToday && <IonBadge color="primary" className="small-badge">Aujourd'hui</IonBadge>}
                  </div>
                  <span className={`day-total`} style={{ color: isAbsence ? cfg.color : computed ? (computed.travail >= (activeMission.weeklyHours/5)*60 ? 'var(--mt-green)' : 'var(--mt-orange)') : 'var(--mt-text-muted)' }}>
                    {isAbsence ? cfg.icon + ' ' + cfg.label : computed ? minutesToHM(computed.travail) : '--h--'}
                  </span>
                </div>

                {/* Type selector */}
                <div className="type-selector">
                  {WORK_TYPES.map(t => {
                    const c = DAY_TYPES[t];
                    const sel = dayType === t;
                    return (
                      <button
                        key={t}
                        className={`type-btn ${sel ? 'selected' : ''}`}
                        style={sel ? { borderColor: c.color, color: c.color, background: c.color + '22' } : {}}
                        onClick={() => setType(key, t)}
                      >
                        {c.icon}
                      </button>
                    );
                  })}
                </div>

                {isWorked && (
                  <div className="day-inputs">
                    <div className="input-group">
                      <div className="input-label">Arrivée</div>
                      <input type="time" className="time-input" value={p.arrivee || ''} onChange={e => setField(key, 'arrivee', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <div className="input-label">Départ</div>
                      <input type="time" className="time-input" value={p.depart || ''} onChange={e => setField(key, 'depart', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <div className="input-label">Pause (min)</div>
                      <input type="number" className="time-input" min="0" max="120" placeholder="45" value={p.pause || ''} onChange={e => setField(key, 'pause', e.target.value)} />
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  className="note-input"
                  placeholder={isAbsence ? `Note (${cfg.label})...` : 'Note / observation...'}
                  value={p.note || ''}
                  onChange={e => setField(key, 'note', e.target.value)}
                />
              </IonCardContent>
            </IonCard>
          );
        })}

        <div style={{ height: 32 }} />
      </IonContent>
    </IonPage>
  );
};
