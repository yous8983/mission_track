// src/pages/ConformitePage.tsx
import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useApp } from '../data/AppContext';
import { EmptyState } from '../components/EmptyState';
import './ConformitePage.css';

type S = 'ok' | 'partiel' | 'nc';
const STATUS = [
  { val: 'ok' as S, label: 'Conforme', color: 'var(--mt-green)', bg: '#0d4429', icon: '✓' },
  { val: 'partiel' as S, label: 'Partiel', color: 'var(--mt-orange)', bg: '#2d2000', icon: '⚠' },
  { val: 'nc' as S, label: 'Non conforme', color: 'var(--mt-red)', bg: '#3d0000', icon: '✕' },
];

export const ConformitePage: React.FC = () => {
  const { activeMission, activeData, updateConformite } = useApp();

  if (!activeMission) {
    return <EmptyState title="Conformité" message="Créez une mission" icon="✅" />;
  }

  const items = activeMission.conformiteItems;
  const conformite = activeData.conformite;
  const score = items.filter(c => conformite[c.id] === 'ok').length;
  const pct = Math.round((score / items.length) * 100);
  const scoreColor = score === items.length ? 'var(--mt-green)' : score >= items.length / 2 ? 'var(--mt-orange)' : 'var(--mt-red)';

  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>✅ Conformité — {activeMission.company}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="conformite-content">
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Conformité</IonTitle></IonToolbar>
        </IonHeader>

        {/* Score */}
        <IonCard className="score-card">
          <IonCardContent>
            <div className="score-row">
              <div>
                <div className="score-label">Score global</div>
                <div className="score-value" style={{ color: scoreColor }}>{score} / {items.length}</div>
                <div className="score-sub">engagements conformes</div>
                <div className="mission-tag" style={{ background: activeMission.accentColor + '33', color: activeMission.accentColor }}>
                  {activeMission.company} · {activeMission.client}
                </div>
              </div>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#21262d" strokeWidth="6" />
                <circle cx="40" cy="40" r={r} fill="none" stroke={scoreColor} strokeWidth="6"
                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)" />
                <text x="40" y="45" textAnchor="middle" fill={scoreColor} fontSize="14" fontWeight="700">{pct}%</text>
              </svg>
            </div>
          </IonCardContent>
        </IonCard>

        {items.map(item => {
          const status = (conformite[item.id] as S) || 'nc';
          const note = conformite[`${item.id}_note`] || '';
          return (
            <IonCard key={item.id} className="conform-card">
              <IonCardContent>
                <div className="conform-header">
                  <div className="conform-icon-wrap" style={{ background: item.color + '22' }}>
                    <IonIcon icon={item.icon as any} style={{ color: item.color, fontSize: 22 }} />
                  </div>
                  <div className="conform-info">
                    <div className="conform-title">{item.label}</div>
                    <div className="conform-desc">{item.desc}</div>
                  </div>
                </div>
                <div className="status-buttons">
                  {STATUS.map(opt => (
                    <button
                      key={opt.val}
                      className={`status-btn ${status === opt.val ? 'active' : ''}`}
                      style={status === opt.val ? { borderColor: opt.color, color: opt.color, background: opt.bg } : {}}
                      onClick={() => updateConformite(item.id, opt.val)}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <div className="preuve-section">
                  <div className="preuve-label">Preuve / Référence</div>
                  <textarea
                    className="preuve-input"
                    placeholder="Réf. mail, document, date..."
                    value={note}
                    onChange={e => updateConformite(`${item.id}_note`, e.target.value)}
                    rows={2}
                  />
                </div>
              </IonCardContent>
            </IonCard>
          );
        })}

        <IonCard className="remind-card">
          <IonCardContent>
            <div className="remind-title">📅 Auto-évaluation mensuelle</div>
            <div className="remind-text">Vérifier chaque mois l'état des engagements et documenter toute évolution.</div>
          </IonCardContent>
        </IonCard>
        <div style={{ height: 32 }} />
      </IonContent>
    </IonPage>
  );
};
