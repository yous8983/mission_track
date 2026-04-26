// src/pages/MissionsPage.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton, IonIcon, IonFab, IonFabButton,
  IonModal, IonButtons, IonAlert, IonBadge,
} from '@ionic/react';
import { addOutline, closeOutline, trashOutline, createOutline, checkmarkOutline } from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import { Mission, DEFAULT_CONFORMITE_ITEMS, ACCENT_COLORS } from '../data/types';
import { computeAbsenceBalances } from '../hooks/useTime';
import './MissionsPage.css';

function genId() {
  return 'mission_' + Date.now();
}

const EMPTY_FORM: Omit<Mission, 'id'> = {
  consultantName: '',
  company: '',
  client: '',
  reference: '',
  description: '',
  startDate: '',
  endDate: '',
  weeklyHours: 35,
  cpBalance: 25,
  rttBalance: 10,
  conformiteItems: DEFAULT_CONFORMITE_ITEMS,
  contacts: [
    { role: 'Manager', name: '', email: '' },
    { role: 'Référent client', name: '', email: '' },
    { role: 'RSSI', name: '', email: '' },
  ],
  accentColor: ACCENT_COLORS[0],
};

export const MissionsPage: React.FC = () => {
  const { state, activeMission, createMission, updateMission, deleteMission, setActiveMission, activeData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editMission, setEditMission] = useState<Mission | null>(null);
  const [form, setForm] = useState<Omit<Mission, 'id'>>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function openCreate() {
    setEditMission(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(m: Mission) {
    setEditMission(m);
    setForm({ ...m });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.consultantName.trim() || !form.company.trim()) return;
    if (editMission) {
      updateMission({ ...form, id: editMission.id });
    } else {
      createMission({ ...form, id: genId() });
    }
    setShowModal(false);
  }

  function setF(key: keyof Omit<Mission,'id'>, val: any) {
    setForm(p => ({ ...p, [key]: val }));
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>🗂 MissionTrack</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="missions-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">MissionTrack</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="missions-count">
          {state.missions.length} mission{state.missions.length > 1 ? 's' : ''} enregistrée{state.missions.length > 1 ? 's' : ''}
        </div>

        {state.missions.length === 0 && (
          <div className="missions-empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Aucune mission</div>
            <div className="empty-sub">Créez votre première mission en appuyant sur +</div>
          </div>
        )}

        {state.missions.map(m => {
          const isActive = m.id === state.activeMissionId;
          const data = state.missionData[m.id] || { pointages: {}, conformite: {}, journal: [] };
          const balances = computeAbsenceBalances(data.pointages, m.cpBalance, m.rttBalance);
          const conformeCount = m.conformiteItems.filter(c => data.conformite[c.id] === 'ok').length;

          return (
            <IonCard
              key={m.id}
              className={`mission-card ${isActive ? 'active' : ''}`}
              style={{ borderColor: isActive ? m.accentColor : undefined }}
              onClick={() => setActiveMission(m.id)}
            >
              <IonCardContent>
                <div className="mission-card-header">
                  <div className="mission-accent" style={{ background: m.accentColor }} />
                  <div className="mission-info">
                    <div className="mission-card-name">{m.consultantName}</div>
                    <div className="mission-card-sub">{m.company} → {m.client}</div>
                    <div className="mission-card-ref">{m.reference} · {m.startDate} – {m.endDate}</div>
                  </div>
                  {isActive && (
                    <IonBadge color="success" className="active-badge">Active</IonBadge>
                  )}
                </div>

                <div className="mission-stats">
                  <div className="stat-pill">
                    <span className="stat-val" style={{ color: 'var(--mt-orange)' }}>{balances.cpRemaining}</span>
                    <span className="stat-lbl">CP restants</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-val" style={{ color: 'var(--mt-purple)' }}>{balances.rttRemaining}</span>
                    <span className="stat-lbl">RTT restants</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-val" style={{ color: conformeCount === m.conformiteItems.length ? 'var(--mt-green)' : 'var(--mt-orange)' }}>
                      {conformeCount}/{m.conformiteItems.length}
                    </span>
                    <span className="stat-lbl">Conformité</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-val" style={{ color: 'var(--mt-accent)' }}>{data.journal.length}</span>
                    <span className="stat-lbl">Journal</span>
                  </div>
                </div>

                <div className="mission-actions" onClick={e => e.stopPropagation()}>
                  <IonButton fill="outline" size="small" onClick={() => openEdit(m)}>
                    <IonIcon icon={createOutline} slot="start" />
                    Modifier
                  </IonButton>
                  {!isActive && (
                    <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteTarget(m.id)}>
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  )}
                  {!isActive && (
                    <IonButton fill="solid" size="small" color="primary" onClick={() => setActiveMission(m.id)}>
                      <IonIcon icon={checkmarkOutline} slot="start" />
                      Activer
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          );
        })}

        <div style={{ height: 96 }} />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreate} color="primary">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Create/Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0,1]} initialBreakpoint={1}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editMission ? 'Modifier la mission' : 'Nouvelle mission'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="form-section-title">👤 Identité</div>
            <div className="form-group">
              <label className="form-label">Nom du consultant *</label>
              <input className="form-input" placeholder="DUPONT Jean" value={form.consultantName} onChange={e => setF('consultantName', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Société *</label>
                <input className="form-input" placeholder="Ex: Accenture, Sopra, Freelance..." value={form.company} onChange={e => setF('company', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Client</label>
                <input className="form-input" placeholder="BNP, SNCF..." value={form.client} onChange={e => setF('client', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Référence document</label>
              <input className="form-input" placeholder="Ex: ORD-2026-001" value={form.reference} onChange={e => setF('reference', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description de la mission / périmètre</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical', minHeight: 72 }}
                placeholder="Contexte, périmètre fonctionnel, technologies, objectifs..."
                value={(form as any).description || ''}
                onChange={e => setF('description' as any, e.target.value)} />
            </div>

            <div className="form-section-title">📅 Période</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Début</label>
                <input type="date" className="form-input" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fin</label>
                <input type="date" className="form-input" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
              </div>
            </div>

            <div className="form-section-title">⚙️ Paramètres</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Heures / semaine</label>
                <input type="number" className="form-input" min="1" max="48" value={form.weeklyHours} onChange={e => setF('weeklyHours', parseInt(e.target.value) || 35)} />
              </div>
              <div className="form-group">
                <label className="form-label">Solde CP initial</label>
                <input type="number" className="form-input" min="0" value={form.cpBalance} onChange={e => setF('cpBalance', parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Solde RTT initial</label>
                <input type="number" className="form-input" min="0" value={form.rttBalance} onChange={e => setF('rttBalance', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-section-title">🎨 Couleur</div>
            <div className="color-picker">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-dot ${form.accentColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setF('accentColor', c)}
                />
              ))}
            </div>

            <IonButton
              expand="block"
              color="primary"
              onClick={handleSave}
              disabled={!form.consultantName.trim() || !form.company.trim()}
              className="submit-btn"
            >
              {editMission ? 'Enregistrer les modifications' : 'Créer la mission'}
            </IonButton>
            <div style={{ height: 32 }} />
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={deleteTarget !== null}
          header="Supprimer la mission ?"
          message="Toutes les données (pointages, journal, conformité) seront supprimées définitivement."
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setDeleteTarget(null) },
            { text: 'Supprimer', role: 'destructive', handler: () => { if (deleteTarget) deleteMission(deleteTarget); setDeleteTarget(null); } },
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />
      </IonContent>
    </IonPage>
  );
};
