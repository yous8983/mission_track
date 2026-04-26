// src/pages/TachesPage.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton, IonIcon,
  IonFab, IonFabButton, IonModal, IonButtons, IonAlert,
} from '@ionic/react';
import { addOutline, closeOutline, trashOutline, createOutline, checkmarkOutline } from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import { Task, TaskStatus, TaskPriority, TASK_STATUS, TASK_PRIORITY } from '../data/types';
import { EmptyState } from '../components/EmptyState';
import './TachesPage.css';

const ALL_STATUSES: TaskStatus[] = ['todo', 'inprogress', 'blocked', 'done'];
const ALL_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

const EMPTY_FORM = {
  titre: '', description: '', statut: 'todo' as TaskStatus,
  priorite: 'medium' as TaskPriority, echeance: '', categorie: '',
};

export const TachesPage: React.FC = () => {
  const { activeMission, activeData, addTask, updateTask, deleteTask } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [form, setForm] = useState(EMPTY_FORM);

  if (!activeMission) {
    return <EmptyState title="Tâches" message="Créez une mission" icon="✅" />;
  }

  const tasks = activeData.tasks || [];
  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.statut === filterStatus);

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.statut === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  function openCreate() {
    setEditTask(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(t: Task) {
    setEditTask(t);
    setForm({
      titre: t.titre, description: t.description || '',
      statut: t.statut, priorite: t.priorite,
      echeance: t.echeance || '', categorie: t.categorie || '',
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.titre.trim()) return;
    if (editTask) {
      updateTask(editTask.id, { ...form });
    } else {
      addTask({ ...form });
    }
    setShowModal(false);
  }

  function cycleStatus(t: Task) {
    const order: TaskStatus[] = ['todo', 'inprogress', 'done', 'blocked'];
    const next = order[(order.indexOf(t.statut) + 1) % order.length];
    updateTask(t.id, { statut: next });
  }

  const doneCount = counts['done'];
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>✅ Tâches — {activeMission.client}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="taches-content">
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Tâches</IonTitle></IonToolbar>
        </IonHeader>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="progress-banner">
            <div className="progress-top">
              <span className="progress-label">{doneCount}/{totalCount} terminées</span>
              <span className="progress-pct" style={{ color: activeMission.accentColor }}>{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, background: activeMission.accentColor }} />
            </div>
          </div>
        )}

        {/* Status filter */}
        <div className="filter-bar">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            style={filterStatus === 'all' ? { borderColor: activeMission.accentColor, color: activeMission.accentColor } : {}}
            onClick={() => setFilterStatus('all')}
          >
            Tout ({totalCount})
          </button>
          {ALL_STATUSES.map(s => {
            const cfg = TASK_STATUS[s];
            const sel = filterStatus === s;
            return (
              <button
                key={s}
                className={`filter-btn ${sel ? 'active' : ''}`}
                style={sel ? { borderColor: cfg.color, color: cfg.color } : {}}
                onClick={() => setFilterStatus(s)}
              >
                {cfg.icon} {cfg.label} ({counts[s]})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="tasks-empty">
            <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
            <div className="empty-title">
              {totalCount === 0 ? 'Aucune tâche' : 'Aucune tâche dans ce statut'}
            </div>
            {totalCount === 0 && (
              <div className="empty-sub">Ajoutez les tâches à réaliser chez {activeMission.client}</div>
            )}
          </div>
        )}

        {/* Task cards grouped by priority */}
        {ALL_PRIORITIES.map(prio => {
          const prioTasks = filtered.filter(t => t.priorite === prio);
          if (prioTasks.length === 0) return null;
          const prioCfg = TASK_PRIORITY[prio];
          return (
            <div key={prio}>
              <div className="prio-header" style={{ color: prioCfg.color }}>
                ● {prioCfg.label} priorité — {prioTasks.length} tâche{prioTasks.length > 1 ? 's' : ''}
              </div>
              {prioTasks.map(task => {
                const sCfg = TASK_STATUS[task.statut];
                const isDone = task.statut === 'done';
                return (
                  <IonCard key={task.id} className={`task-card ${isDone ? 'done' : ''}`}
                    style={{ borderLeftColor: sCfg.color }}>
                    <IonCardContent>
                      <div className="task-header">
                        <button className="status-circle" style={{ borderColor: sCfg.color, color: sCfg.color }}
                          onClick={() => cycleStatus(task)} title="Changer le statut">
                          {sCfg.icon}
                        </button>
                        <div className="task-main">
                          <div className={`task-title ${isDone ? 'striked' : ''}`}>{task.titre}</div>
                          <div className="task-meta">
                            <span className="task-status-label" style={{ color: sCfg.color }}>{sCfg.label}</span>
                            {task.categorie && <span className="task-cat">· {task.categorie}</span>}
                            {task.echeance && <span className="task-due">· 📅 {task.echeance}</span>}
                          </div>
                        </div>
                        <div className="task-actions">
                          <IonButton fill="clear" size="small" onClick={() => openEdit(task)}>
                            <IonIcon icon={createOutline} slot="icon-only" style={{ fontSize: 16 }} />
                          </IonButton>
                          <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteId(task.id)}>
                            <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 16 }} />
                          </IonButton>
                        </div>
                      </div>
                      {task.description && (
                        <div className="task-desc">{task.description}</div>
                      )}
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </div>
          );
        })}

        <div style={{ height: 96 }} />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreate} color="primary">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Create / Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0, 1]} initialBreakpoint={1}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}><IonIcon icon={closeOutline} /></IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">

            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input className="form-input" placeholder="Description courte de la tâche" value={form.titre}
                onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Description / détail</label>
              <textarea className="form-input form-textarea" rows={3}
                placeholder="Contexte, critères d'acceptance, notes..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <input className="form-input" placeholder="Dev, Recette, Réunion..." value={form.categorie}
                  onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Échéance</label>
                <input type="date" className="form-input" value={form.echeance}
                  onChange={e => setForm(p => ({ ...p, echeance: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priorité</label>
              <div className="btn-group">
                {ALL_PRIORITIES.map(p => {
                  const cfg = TASK_PRIORITY[p];
                  return (
                    <button key={p} className={`group-btn ${form.priorite === p ? 'selected' : ''}`}
                      style={form.priorite === p ? { borderColor: cfg.color, color: cfg.color, background: cfg.color + '22' } : {}}
                      onClick={() => setForm(prev => ({ ...prev, priorite: p }))}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <div className="btn-group">
                {ALL_STATUSES.map(s => {
                  const cfg = TASK_STATUS[s];
                  return (
                    <button key={s} className={`group-btn ${form.statut === s ? 'selected' : ''}`}
                      style={form.statut === s ? { borderColor: cfg.color, color: cfg.color, background: cfg.color + '22' } : {}}
                      onClick={() => setForm(prev => ({ ...prev, statut: s }))}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <IonButton expand="block" color="primary" onClick={handleSave} disabled={!form.titre.trim()}>
              {editTask ? 'Enregistrer' : 'Ajouter la tâche'}
            </IonButton>
            <div style={{ height: 32 }} />
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={deleteId !== null}
          header="Supprimer la tâche ?"
          message="Cette action est irréversible."
          buttons={[
            { text: 'Annuler', role: 'cancel', handler: () => setDeleteId(null) },
            { text: 'Supprimer', role: 'destructive', handler: () => { if (deleteId) deleteTask(deleteId); setDeleteId(null); } },
          ]}
          onDidDismiss={() => setDeleteId(null)}
        />
      </IonContent>
    </IonPage>
  );
};
