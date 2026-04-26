// src/App.tsx
import React, { useEffect, useState } from 'react';
import {
  IonApp, IonRouterOutlet, IonTabBar, IonTabButton,
  IonTabs, IonIcon, IonLabel, setupIonicReact, IonToast,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  timeOutline, bookOutline, briefcaseOutline,
  listOutline, statsChartOutline,
} from 'ionicons/icons';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

import { AppProvider } from './data/AppContext';
import { MissionsPage }     from './pages/MissionsPage';
import { PointagePage }     from './pages/PointagePage';
import { TachesPage }       from './pages/TachesPage';
import { JournalPage }      from './pages/JournalPage';
import { StatistiquesPage } from './pages/StatistiquesPage';
import { BilanPage }        from './pages/BilanPage';

setupIonicReact({ mode: 'ios' });

const App: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  return (
    <IonApp>
      <AppProvider>
        <IonReactRouter>
          {/* @ts-ignore */}
          <IonTabs>
            <IonRouterOutlet>
              <Switch>
                <Route exact path="/missions"  component={MissionsPage} />
                <Route exact path="/pointage"  component={PointagePage} />
                <Route exact path="/taches"    component={TachesPage} />
                <Route exact path="/journal"   component={JournalPage} />
                <Route exact path="/stats"     component={StatistiquesPage} />
                <Route exact path="/bilan"     component={BilanPage} />
                <Route exact path="/">
                  <Redirect to="/missions" />
                </Route>
              </Switch>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="missions" href="/missions">
                <IonIcon icon={briefcaseOutline} />
                <IonLabel>Missions</IonLabel>
              </IonTabButton>
              <IonTabButton tab="pointage" href="/pointage">
                <IonIcon icon={timeOutline} />
                <IonLabel>Pointage</IonLabel>
              </IonTabButton>
              <IonTabButton tab="taches" href="/taches">
                <IonIcon icon={listOutline} />
                <IonLabel>Tâches</IonLabel>
              </IonTabButton>
              <IonTabButton tab="journal" href="/journal">
                <IonIcon icon={bookOutline} />
                <IonLabel>Journal</IonLabel>
              </IonTabButton>
              <IonTabButton tab="stats" href="/stats">
                <IonIcon icon={statsChartOutline} />
                <IonLabel>Stats & PDF</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>

          <IonToast
            isOpen={updateAvailable}
            message="Nouvelle version disponible — rechargez l'app"
            buttons={[{ text: 'Recharger', handler: () => window.location.reload() }]}
            position="top"
            color="primary"
            onDidDismiss={() => setUpdateAvailable(false)}
          />
        </IonReactRouter>
      </AppProvider>
    </IonApp>
  );
};

export default App;
