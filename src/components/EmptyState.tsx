// src/components/EmptyState.tsx
import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';

interface Props {
  title: string;
  message: string;
  icon?: string;
}

export const EmptyState: React.FC<Props> = ({ title, message, icon = '📋' }) => (
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen style={{ '--background': '#0d1117' }}>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', textAlign: 'center', padding: '32px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#484f58', marginBottom: 8 }}>
          Aucune mission active
        </div>
        <div style={{ fontSize: 13, color: '#30363d', lineHeight: 1.5 }}>
          Créez ou activez une mission dans l'onglet <strong style={{ color: '#58a6ff' }}>Missions</strong>
        </div>
        <div style={{ marginTop: 24, fontSize: 11, color: '#21262d', letterSpacing: 1 }}>MISSIONTRACK</div>
      </div>
    </IonContent>
  </IonPage>
);
