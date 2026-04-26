# MissionTrack

Application mobile de suivi de mission pour consultants et prestataires.
Multi-missions, multi-entreprises, 100% generique.

## Fonctionnalites

- Missions : plusieurs missions simultanees (societe, client, periode, contacts)
- Pointage : heures quotidiennes avec gestion CP, RTT, maladie, teletravail
- Taches : suivi par mission avec statut et priorite
- Journal : faits marquants avec preuves et references
- Conformite : engagements contractuels configurables par mission
- Stats et PDF : graphique mensuel et export PDF hebdomadaire/mensuel
- Hors-ligne : Service Worker integre, fonctionne sans connexion

## Stack technique

- Ionic React + TypeScript
- Capacitor (build Android natif)
- jsPDF (export PDF)
- localStorage (donnees locales, aucun serveur)

## Build PWA

npm install
npm run build
serve -s build -l 3000
Puis Chrome > Ajouter a l ecran d accueil

## Build APK

Automatise via GitHub Actions.
Chaque push sur master genere un APK dans l onglet Actions > Artifacts.

## Donnees et confidentialite

Toutes les donnees sont stockees localement sur l appareil (localStorage).
Aucune donnee n est transmise a un serveur externe.
Cle de stockage : missiontrack_v3

## Licence

Usage prive - application de gestion personnelle de mission.
