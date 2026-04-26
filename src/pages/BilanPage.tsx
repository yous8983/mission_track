// src/pages/BilanPage.tsx
import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { businessOutline, personOutline, keyOutline, timeOutline, bookOutline, shieldCheckmarkOutline, listOutline } from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import { EmptyState } from '../components/EmptyState';
import { Pointage } from '../data/types';
import { getWeekDays, getMondayOfWeek, getTodayKey, computeDay, minutesToHM, computeAbsenceBalances, isAbsenceJustifiee } from '../hooks/useTime';
import './BilanPage.css';

export const BilanPage: React.FC = () => {
  const { activeMission, activeData, state } = useApp();

  if (!activeMission) {
    return <EmptyState title="Bilan" message="Créez une mission" icon="📊" />;
  }

  const { pointages, conformite, journal } = activeData;
  const today = getTodayKey();
  const weekDays = getWeekDays(getMondayOfWeek(today));

  const weekTotal = weekDays.reduce((acc, k) => {
    const p = pointages[k];
    if (!p || isAbsenceJustifiee(p.type)) return acc;
    const r = computeDay(p);
    return acc + (r ? Math.max(0, r.travail) : 0);
  }, 0);

  const tasks = activeData.tasks || [];
  const tasksDone = tasks.filter(t => t.statut === 'done').length;
  const conformiteScore = activeMission.conformiteItems.filter(c => conformite[c.id] === 'ok').length;
  const scoreColor = conformiteScore === activeMission.conformiteItems.length ? 'var(--mt-green)' : conformiteScore >= activeMission.conformiteItems.length / 2 ? 'var(--mt-orange)' : 'var(--mt-red)';
  const balances = computeAbsenceBalances(pointages, activeMission.cpBalance, activeMission.rttBalance);

  const totalAbsences = balances.cpUsed + balances.rttUsed;
  const sickDays = Object.values(pointages).filter((p: Pointage) => p.type === 'sick').length;
  const remoteDays = Object.values(pointages).filter((p: Pointage) => p.type === 'remote').length;

  const RAPPELS = [
    'Mettre à jour le journal chaque semaine',
    'Auto-évaluation de conformité chaque mois',
    'Documenter chaque preuve avec date et référence',
    'Consulter le plan de prévention à chaque accès site',
    'Vérifier le respect des 11h de repos quotidien',
  ];

  const ICON_MAP: Record<string, string> = {
    'Manager': businessOutline,
    'Référent client': personOutline,
    'RSSI': keyOutline,
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>📊 Bilan</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="bilan-content">
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Bilan</IonTitle></IonToolbar>
        </IonHeader>

        {/* Mission identity */}
        <div className="mission-header">
          <div className="mission-badge" style={{ background: activeMission.accentColor }}>
            {activeMission.company.toUpperCase()}
          </div>
          <div className="mission-name">{activeMission.consultantName}</div>
          <div className="mission-client">{activeMission.client}</div>
          <div className="mission-period">{activeMission.startDate} → {activeMission.endDate}</div>
          {activeMission.reference && (
            <div className="mission-ref">Réf. {activeMission.reference}</div>
          )}
          {(activeMission as any).description && (
            <div className="mission-desc-block">{(activeMission as any).description}</div>
          )}
        </div>

        {/* KPI grid */}
        <div className="kpi-grid">
          <IonCard className="kpi-card">
            <IonCardContent>
              <IonIcon icon={shieldCheckmarkOutline} className="kpi-icon" style={{ color: scoreColor }} />
              <div className="kpi-value" style={{ color: scoreColor }}>{conformiteScore}/{activeMission.conformiteItems.length}</div>
              <div className="kpi-label">Conformité</div>
            </IonCardContent>
          </IonCard>
          <IonCard className="kpi-card">
            <IonCardContent>
              <IonIcon icon={timeOutline} className="kpi-icon" style={{ color: 'var(--mt-accent)' }} />
              <div className="kpi-value" style={{ color: 'var(--mt-accent)' }}>{minutesToHM(weekTotal)}</div>
              <div className="kpi-label">Cette semaine</div>
            </IonCardContent>
          </IonCard>
          <IonCard className="kpi-card">
            <IonCardContent>
              <IonIcon icon={bookOutline} className="kpi-icon" style={{ color: 'var(--mt-purple)' }} />
              <div className="kpi-value" style={{ color: 'var(--mt-purple)' }}>{journal.length}</div>
              <div className="kpi-label">Journal</div>
            </IonCardContent>
          </IonCard>
          <IonCard className="kpi-card">
            <IonCardContent>
              <IonIcon icon={listOutline} className="kpi-icon" style={{ color: 'var(--mt-green)' }} />
              <div className="kpi-value" style={{ color: 'var(--mt-green)' }}>{tasksDone}/{tasks.length}</div>
              <div className="kpi-label">Tâches</div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Absences */}
        <IonCard className="section-card">
          <IonCardContent>
            <div className="section-title">🌴 Solde congés & absences</div>
            <div className="absence-grid">
              <div className="absence-item">
                <div className="absence-val" style={{ color: 'var(--mt-orange)' }}>{balances.cpRemaining}</div>
                <div className="absence-lbl">CP restants</div>
                <div className="absence-sub">sur {activeMission.cpBalance} initiaux</div>
              </div>
              <div className="absence-item">
                <div className="absence-val" style={{ color: 'var(--mt-purple)' }}>{balances.rttRemaining}</div>
                <div className="absence-lbl">RTT restants</div>
                <div className="absence-sub">sur {activeMission.rttBalance} initiaux</div>
              </div>
              <div className="absence-item">
                <div className="absence-val" style={{ color: 'var(--mt-red)' }}>{sickDays}</div>
                <div className="absence-lbl">Jours maladie</div>
                <div className="absence-sub">sur la mission</div>
              </div>
              <div className="absence-item">
                <div className="absence-val" style={{ color: 'var(--mt-green)' }}>{remoteDays}</div>
                <div className="absence-lbl">Télétravail</div>
                <div className="absence-sub">jours total</div>
              </div>
            </div>
            {totalAbsences > 0 && (
              <div className="absence-progress">
                <div className="progress-label">
                  <span>CP posés : {balances.cpUsed}j</span>
                  <span>RTT posés : {balances.rttUsed}j</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill-cp" style={{ width: `${(balances.cpUsed / activeMission.cpBalance) * 100}%` }} />
                </div>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Conformité recap */}
        <IonCard className="section-card">
          <IonCardContent>
            <div className="section-title">Engagements contractuels</div>
            {activeMission.conformiteItems.map(item => {
              const status = conformite[item.id];
              return (
                <div key={item.id} className="engage-row">
                  <IonIcon icon={item.icon as any} style={{ color: item.color, fontSize: 18 }} />
                  <span className="engage-label">{item.label}</span>
                  <span className={`engage-badge ${status === 'ok' ? 'badge-ok' : status === 'partiel' ? 'badge-warn' : 'badge-nc'}`}>
                    {status === 'ok' ? '✓' : status === 'partiel' ? '⚠' : '✕'} {status === 'ok' ? 'Conforme' : status === 'partiel' ? 'Partiel' : 'NC'}
                  </span>
                </div>
              );
            })}
          </IonCardContent>
        </IonCard>

        {/* Contacts */}
        {activeMission.contacts.length > 0 && (
          <IonCard className="section-card">
            <IonCardContent>
              <div className="section-title">Contacts clés</div>
              {activeMission.contacts.map((c, i) => (
                <div key={i} className="contact-row">
                  <div className="contact-icon-wrap" style={{ background: activeMission.accentColor + '22' }}>
                    <IonIcon icon={ICON_MAP[c.role] || personOutline} style={{ color: activeMission.accentColor, fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="contact-role">{c.role}</div>
                    <div className="contact-label">{c.name || '—'}</div>
                    {c.email && <div className="contact-email">{c.email}</div>}
                  </div>
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        )}

        {/* Rappels */}
        <IonCard className="section-card remind-card">
          <IonCardContent>
            <div className="section-title">📌 Rappels</div>
            {RAPPELS.map((r, i) => (
              <div key={i} className="rappel-row">
                <span className="rappel-dot">·</span>
                <span className="rappel-text">{r}</span>
              </div>
            ))}
          </IonCardContent>
        </IonCard>

        <div className="doc-footer">{activeMission.reference} · Mission Tracker v2</div>
        <div style={{ height: 32 }} />
      </IonContent>
    </IonPage>
  );
};
