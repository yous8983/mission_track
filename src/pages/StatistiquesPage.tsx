// src/pages/StatistiquesPage.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonButton, IonIcon, IonSpinner, IonToast,
} from '@ionic/react';
import { downloadOutline, calendarOutline, documentTextOutline } from 'ionicons/icons';
import { useApp } from '../data/AppContext';
import {
  computeMonthStats, getMonthsInRange, minutesToHM,
  getMondayOfWeek, getTodayKey, getWeekDays, computeDay,
  isAbsenceJustifiee, computeAbsenceBalances,
} from '../hooks/useTime';
import { EmptyState } from '../components/EmptyState';
import { Pointage } from '../data/types';
import { exportWeeklyPDF, exportMonthlyPDF } from '../hooks/usePdfExport';
import './StatistiquesPage.css';

export const StatistiquesPage: React.FC = () => {
  const { activeMission, activeData } = useApp();
  const [exporting, setExporting] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  if (!activeMission) {
    return <EmptyState title="Statistiques" message="Créez une mission" icon="📊" />;
  }

  const today = getTodayKey();
  const currentMonday = getMondayOfWeek(today);
  const { pointages } = activeData;

  // ── Monthly stats ──
  const start = activeMission.startDate || today.slice(0, 7) + '-01';
  const end = activeMission.endDate || today;
  const months = getMonthsInRange(start > today ? start : start, end < today ? end : today);
  const monthStats = months.map(m => computeMonthStats(m, pointages, activeMission.weeklyHours));

  // Chart dimensions
  const chartW = 320;
  const chartH = 120;
  const barW = Math.max(8, Math.min(28, (chartW - 20) / Math.max(monthStats.length, 1) - 4));
  const maxVal = Math.max(...monthStats.map(s => Math.max(s.worked, s.target)), 1);

  function barHeight(val: number) {
    return Math.max(2, (val / maxVal) * chartH);
  }

  // ── Current week totals ──
  const weekDays = getWeekDays(currentMonday);
  const weekTotal = weekDays.reduce((acc, k) => {
    const p = pointages[k];
    if (!p || isAbsenceJustifiee(p.type)) return acc;
    const r = computeDay(p);
    return acc + (r ? Math.max(0, r.travail) : 0);
  }, 0);

  const balances = computeAbsenceBalances(pointages, activeMission.cpBalance, activeMission.rttBalance);

  // ── Global mission totals ──
  const totalWorked = Object.entries(pointages).reduce((acc, [, p]: [string, Pointage]) => {
    if (!p || isAbsenceJustifiee(p.type)) return acc;
    const r = computeDay(p);
    return acc + (r ? Math.max(0, r.travail) : 0);
  }, 0);

  async function handleWeeklyExport() {
    setExporting('week');
    try {
      await exportWeeklyPDF(activeMission!, activeData, currentMonday);
      setToast('Rapport hebdomadaire exporté ✓');
    } catch (e) {
      setToast('Erreur lors de l\'export PDF');
    } finally {
      setExporting(null);
    }
  }

  async function handleMonthlyExport(monthKey: string) {
    setExporting(monthKey);
    try {
      await exportMonthlyPDF(activeMission!, activeData, monthKey);
      setToast(`Rapport ${monthKey} exporté ✓`);
    } catch (e) {
      setToast('Erreur lors de l\'export PDF');
    } finally {
      setExporting(null);
    }
  }

  const accentColor = activeMission.accentColor;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>📈 Statistiques</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="stats-content">
        <IonHeader collapse="condense">
          <IonToolbar><IonTitle size="large">Statistiques</IonTitle></IonToolbar>
        </IonHeader>

        {/* Global KPIs */}
        <div className="stats-kpi-grid">
          <div className="stats-kpi">
            <div className="stats-kpi-val" style={{ color: accentColor }}>{minutesToHM(weekTotal)}</div>
            <div className="stats-kpi-lbl">Cette semaine</div>
          </div>
          <div className="stats-kpi">
            <div className="stats-kpi-val" style={{ color: 'var(--mt-green)' }}>{minutesToHM(totalWorked)}</div>
            <div className="stats-kpi-lbl">Total mission</div>
          </div>
          <div className="stats-kpi">
            <div className="stats-kpi-val" style={{ color: 'var(--mt-orange)' }}>{balances.cpRemaining}j</div>
            <div className="stats-kpi-lbl">CP restants</div>
          </div>
          <div className="stats-kpi">
            <div className="stats-kpi-val" style={{ color: 'var(--mt-purple)' }}>{balances.rttRemaining}j</div>
            <div className="stats-kpi-lbl">RTT restants</div>
          </div>
        </div>

        {/* Monthly chart */}
        <IonCard className="chart-card">
          <IonCardContent>
            <div className="chart-title">Heures travaillées / mois</div>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: accentColor }} /> Travaillé
              <span className="legend-dot" style={{ background: 'var(--mt-text-muted)', marginLeft: 12 }} /> Objectif
            </div>

            {monthStats.length === 0 ? (
              <div className="chart-empty">Aucune donnée disponible</div>
            ) : (
              <div className="chart-scroll">
                <svg
                  width={Math.max(chartW, monthStats.length * (barW + 6) + 20)}
                  height={chartH + 32}
                  style={{ overflow: 'visible' }}
                >
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75, 1].map(f => (
                    <line
                      key={f}
                      x1={0} y1={chartH - f * chartH}
                      x2={Math.max(chartW, monthStats.length * (barW + 6) + 20)}
                      y2={chartH - f * chartH}
                      stroke="#21262d" strokeWidth={1}
                    />
                  ))}

                  {monthStats.map((s, i) => {
                    const x = 10 + i * (barW + 6);
                    const wH = barHeight(s.worked);
                    const tH = barHeight(s.target);
                    const isSelected = selectedMonth === months[i];
                    return (
                      <g key={i} onClick={() => setSelectedMonth(isSelected ? null : months[i])} style={{ cursor: 'pointer' }}>
                        {/* Target bar (background) */}
                        <rect
                          x={x} y={chartH - tH}
                          width={barW} height={tH}
                          fill="#21262d" rx={3}
                        />
                        {/* Worked bar */}
                        <rect
                          x={x + 2} y={chartH - wH}
                          width={barW - 4} height={wH}
                          fill={s.worked >= s.target ? accentColor : 'var(--mt-orange)'}
                          rx={2}
                          opacity={isSelected ? 1 : 0.85}
                        />
                        {/* Selection highlight */}
                        {isSelected && (
                          <rect x={x - 2} y={0} width={barW + 4} height={chartH}
                            fill={accentColor} opacity={0.08} rx={3} />
                        )}
                        {/* Label */}
                        <text
                          x={x + barW / 2} y={chartH + 14}
                          textAnchor="middle" fill="#8b949e" fontSize={9}
                        >
                          {s.label.slice(0, 3)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Selected month detail */}
            {selectedMonth && (() => {
              const idx = months.indexOf(selectedMonth);
              const s = monthStats[idx];
              if (!s) return null;
              const diff = s.worked - s.target;
              return (
                <div className="month-detail">
                  <div className="month-detail-title">{s.label}</div>
                  <div className="month-detail-row">
                    <span>Travaillé</span><span style={{ color: accentColor }}>{minutesToHM(s.worked)}</span>
                  </div>
                  <div className="month-detail-row">
                    <span>Objectif</span><span style={{ color: 'var(--mt-text-sub)' }}>{minutesToHM(s.target)}</span>
                  </div>
                  <div className="month-detail-row">
                    <span>Écart</span>
                    <span style={{ color: diff >= 0 ? 'var(--mt-green)' : 'var(--mt-red)' }}>
                      {diff >= 0 ? '+' : ''}{minutesToHM(Math.abs(diff))}
                    </span>
                  </div>
                  <div className="month-detail-row">
                    <span>Absences</span><span style={{ color: 'var(--mt-orange)' }}>{s.absences} jour(s)</span>
                  </div>
                  <IonButton
                    expand="block" fill="outline" size="small"
                    style={{ marginTop: 10 }}
                    disabled={exporting === selectedMonth}
                    onClick={() => handleMonthlyExport(selectedMonth)}
                  >
                    {exporting === selectedMonth
                      ? <IonSpinner name="dots" />
                      : <><IonIcon icon={downloadOutline} slot="start" /> Export PDF mensuel</>
                    }
                  </IonButton>
                </div>
              );
            })()}
          </IonCardContent>
        </IonCard>

        {/* Export section */}
        <IonCard className="export-card">
          <IonCardContent>
            <div className="export-title">📄 Exports PDF</div>
            <div className="export-desc">
              Générez des rapports signables pour votre manager ou client.
              Inclut : pointage, journal, conformité.
            </div>

            <IonButton
              expand="block"
              color="primary"
              disabled={exporting === 'week'}
              onClick={handleWeeklyExport}
              style={{ marginTop: 14 }}
            >
              {exporting === 'week'
                ? <IonSpinner name="dots" />
                : <><IonIcon icon={calendarOutline} slot="start" /> Rapport semaine en cours</>
              }
            </IonButton>

            <div className="export-hint">
              Pour exporter un autre mois, tappez sur sa barre dans le graphique.
            </div>
          </IonCardContent>
        </IonCard>

        {/* Month list with export buttons */}
        <IonCard className="months-card">
          <IonCardContent>
            <div className="export-title">Tous les mois</div>
            {months.length === 0 && (
              <div className="chart-empty">Aucune période à afficher</div>
            )}
            {[...months].reverse().map((m, i) => {
              const s = monthStats[months.length - 1 - i];
              const diff = s.worked - s.target;
              return (
                <div key={m} className="month-row">
                  <div className="month-row-info">
                    <div className="month-row-label">{s.label}</div>
                    <div className="month-row-sub">
                      <span style={{ color: accentColor }}>{minutesToHM(s.worked)}</span>
                      <span style={{ color: 'var(--mt-text-muted)' }}> / {minutesToHM(s.target)}</span>
                      <span style={{ color: diff >= 0 ? 'var(--mt-green)' : 'var(--mt-red)', marginLeft: 6 }}>
                        {diff >= 0 ? '▲' : '▼'} {minutesToHM(Math.abs(diff))}
                      </span>
                    </div>
                  </div>
                  <IonButton
                    fill="clear" size="small"
                    disabled={exporting === m}
                    onClick={() => handleMonthlyExport(m)}
                  >
                    {exporting === m
                      ? <IonSpinner name="dots" style={{ width: 18, height: 18 }} />
                      : <IonIcon icon={downloadOutline} slot="icon-only" />
                    }
                  </IonButton>
                </div>
              );
            })}
          </IonCardContent>
        </IonCard>

        <div style={{ height: 32 }} />
      </IonContent>

      <IonToast
        isOpen={!!toast}
        message={toast}
        duration={2500}
        onDidDismiss={() => setToast('')}
        position="top"
        color="dark"
      />
    </IonPage>
  );
};
