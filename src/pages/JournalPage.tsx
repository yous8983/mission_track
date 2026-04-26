// src/pages/JournalPage.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton, IonIcon, IonFab, IonFabButton,
  IonModal, IonButtons, IonAlert,
} from '@ionic/react';
import { addOutline, trashOutline, attachOutline, closeOutline } from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import { EmptyState } from '../components/EmptyState';
import { getTodayKey } from '../hooks/useTime';
import './JournalPage.css';

const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export const JournalPage: React.FC = () => {
  const { activeMission, activeData, addJournalEntry, deleteJournalEntry } = useApp();
  const today = getTodayKey();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ date: today, titre: '', detail: '', preuve: '' });

  function handleAdd() {
    if (!form.titre.trim()) return;
    addJournalEntry(form);
    setForm({ date: today, titre: '', detail: '', preuve: '' });
    setShowModal(false);
  }

  const journal = activeData.journal;

  if (!activeMission) {
    return <EmptyState title="Journal" message="Créez une mission" icon="📓" />;
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>📓 Journal — {activeMission.company}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="journal-content">
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Journal</IonTitle></IonToolbar>
        </IonHeader>

        <div className="journal-header-bar">
          <div className="journal-count">{journal.length} entrée{journal.length !== 1 ? 's' : ''}</div>
          <div className="mission-tag" style={{ background: activeMission.accentColor + '33', color: activeMission.accentColor }}>
            {activeMission.consultantName}
          </div>
        </div>

        {journal.length === 0 && (
          <div className="journal-empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Journal vide</div>
            <div className="empty-sub">Documentez vos faits marquants chaque semaine.</div>
          </div>
        )}

        {journal.map(entry => (
          <IonCard key={entry.id} className="journal-card">
            <IonCardContent>
              <div className="journal-card-header">
                <div className="journal-date">{fmtDate(entry.date)}</div>
                <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteId(entry.id)}>
                  <IonIcon icon={trashOutline} slot="icon-only" />
                </IonButton>
              </div>
              <div className="journal-titre">{entry.titre}</div>
              {entry.detail && <div className="journal-detail">{entry.detail}</div>}
              {entry.preuve && (
                <div className="journal-preuve">
                  <IonIcon icon={attachOutline} />
                  {entry.preuve}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        ))}

        <div style={{ height: 96 }} />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)} color="primary">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0,1]} initialBreakpoint={1}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Nouvelle entrée</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}><IonIcon icon={closeOutline} /></IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Titre / Fait marquant *</label>
              <input type="text" className="form-input" placeholder="Ex: Réunion sécurité, livraison module..." value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Détail</label>
              <textarea className="form-input form-textarea" placeholder="Description..." value={form.detail} onChange={e => setForm(p => ({ ...p, detail: e.target.value }))} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Preuve / Référence</label>
              <input type="text" className="form-input" placeholder="Mail du 26/04, doc RSSI..." value={form.preuve} onChange={e => setForm(p => ({ ...p, preuve: e.target.value }))} />
            </div>
            <IonButton expand="block" color="primary" onClick={handleAdd} disabled={!form.titre.trim()}>
              Ajouter au journal
            </IonButton>
            <div style={{ height: 32 }} />
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={deleteId !== null}
          header="Supprimer l'entrée ?"
          message="Cette action est irréversible."
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setDeleteId(null) },
            { text: 'Supprimer', role: 'destructive', handler: () => { if (deleteId) deleteJournalEntry(deleteId); setDeleteId(null); } },
          ]}
          onDidDismiss={() => setDeleteId(null)}
        />
      </IonContent>
    </IonPage>
  );
};
