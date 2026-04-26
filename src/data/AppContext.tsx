// src/data/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Mission, MissionData, Pointage, JournalEntry, Task, DEFAULT_CONFORMITE_ITEMS } from './types';

const STORAGE_KEY = 'missiontrack_v3';

const EMPTY_DATA: MissionData = {
  pointages: {},
  conformite: {},
  journal: [],
  tasks: [],
};

const INITIAL_STATE: AppState = {
  missions: [],
  missionData: {},
  activeMissionId: null,
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old data: ensure tasks array exists per mission
      Object.keys(parsed.missionData || {}).forEach(id => {
        if (!parsed.missionData[id].tasks) parsed.missionData[id].tasks = [];
      });
      // Migrate: remove legacy hardcoded mission if empty
      const legacyId = 'mission_legacy_v1';
      if (parsed.missionData[legacyId]) {
        const d = parsed.missionData[legacyId];
        const isEmpty = Object.keys(d.pointages).length === 0 && d.journal.length === 0;
        if (isEmpty) {
          parsed.missions = parsed.missions.filter((m: Mission) => m.id !== legacyId);
          delete parsed.missionData[legacyId];
          if (parsed.activeMissionId === legacyId) {
            parsed.activeMissionId = parsed.missions[0]?.id || null;
          }
        }
      }
      return parsed;
    }
  } catch {}
  return INITIAL_STATE;
}

interface AppContextValue {
  state: AppState;
  activeMission: Mission | null;
  activeData: MissionData;
  createMission: (m: Mission) => void;
  updateMission: (m: Mission) => void;
  deleteMission: (id: string) => void;
  setActiveMission: (id: string) => void;
  updatePointage: (date: string, p: Partial<Pointage>) => void;
  updateConformite: (key: string, val: string) => void;
  addJournalEntry: (e: Omit<JournalEntry, 'id'>) => void;
  deleteJournalEntry: (id: number) => void;
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: number, changes: Partial<Task>) => void;
  deleteTask: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const activeMission = state.missions.find(m => m.id === state.activeMissionId) || null;
  const activeData = (state.activeMissionId ? state.missionData[state.activeMissionId] : null) || EMPTY_DATA;

  const setActiveMission = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeMissionId: id }));
  }, []);

  const createMission = useCallback((m: Mission) => {
    setState(prev => ({
      ...prev,
      missions: [...prev.missions, m],
      missionData: { ...prev.missionData, [m.id]: { ...EMPTY_DATA } },
      activeMissionId: m.id,
    }));
  }, []);

  const updateMission = useCallback((m: Mission) => {
    setState(prev => ({ ...prev, missions: prev.missions.map(x => x.id === m.id ? m : x) }));
  }, []);

  const deleteMission = useCallback((id: string) => {
    setState(prev => {
      const missions = prev.missions.filter(m => m.id !== id);
      const missionData = { ...prev.missionData };
      delete missionData[id];
      const activeMissionId = prev.activeMissionId === id ? (missions[0]?.id || null) : prev.activeMissionId;
      return { missions, missionData, activeMissionId };
    });
  }, []);

  const withActive = useCallback((fn: (data: MissionData) => MissionData) => {
    setState(prev => {
      if (!prev.activeMissionId) return prev;
      const data = prev.missionData[prev.activeMissionId] || EMPTY_DATA;
      return { ...prev, missionData: { ...prev.missionData, [prev.activeMissionId]: fn(data) } };
    });
  }, []);

  const updatePointage = useCallback((date: string, p: Partial<Pointage>) => {
    withActive(data => ({
      ...data,
      pointages: { ...data.pointages, [date]: { ...(data.pointages[date] || { type: 'work' }), ...p } },
    }));
  }, [withActive]);

  const updateConformite = useCallback((key: string, val: string) => {
    withActive(data => ({ ...data, conformite: { ...data.conformite, [key]: val } }));
  }, [withActive]);

  const addJournalEntry = useCallback((e: Omit<JournalEntry, 'id'>) => {
    withActive(data => ({ ...data, journal: [{ ...e, id: Date.now() }, ...data.journal] }));
  }, [withActive]);

  const deleteJournalEntry = useCallback((id: number) => {
    withActive(data => ({ ...data, journal: data.journal.filter(e => e.id !== id) }));
  }, [withActive]);

  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt'>) => {
    withActive(data => ({
      ...data,
      tasks: [{ ...t, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }, ...(data.tasks || [])],
    }));
  }, [withActive]);

  const updateTask = useCallback((id: number, changes: Partial<Task>) => {
    withActive(data => ({
      ...data,
      tasks: (data.tasks || []).map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, [withActive]);

  const deleteTask = useCallback((id: number) => {
    withActive(data => ({ ...data, tasks: (data.tasks || []).filter(t => t.id !== id) }));
  }, [withActive]);

  return (
    <AppContext.Provider value={{
      state, activeMission, activeData,
      createMission, updateMission, deleteMission, setActiveMission,
      updatePointage, updateConformite,
      addJournalEntry, deleteJournalEntry,
      addTask, updateTask, deleteTask,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
