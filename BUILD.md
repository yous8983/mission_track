# MissionTrack — Guide de Build Termux

## Prérequis

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts openjdk-17 -y
node --version   # doit être >= 16
java --version   # pour l'APK Android
```

## Étape 1 — Installer les dépendances

```bash
cd ~/downloads/missiontrack
npm install
```

> Si erreur de mémoire :
> ```bash
> export NODE_OPTIONS="--max-old-space-size=512"
> npm install
> ```

## Étape 2 — Tester en dev

```bash
npm start
# Ouvrir http://localhost:3000 dans Chrome
```

## Étape 3 — Build production (web)

```bash
npm run build
# Résultat dans ./build/
```

## Étape 4 — PWA (recommandé sur Termux)

```bash
npm install -g serve
serve -s build -l 8080
```

Dans Chrome Android :
**Menu ⋮ → Ajouter à l'écran d'accueil → Installer**

L'app fonctionne ensuite **hors-ligne** grâce au Service Worker.

---

## Étape 5 — APK Android natif (optionnel)

### Configuration Android SDK sur Termux

```bash
# Télécharger cmdline-tools Android
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*.zip
mv cmdline-tools latest

# Variables d'environnement (à ajouter dans ~/.bashrc)
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.bashrc

# Accepter les licences et installer les outils
sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

### Build APK

```bash
cd ~/downloads/missiontrack

# Build React
npm run build

# Initialiser Capacitor Android (première fois)
npx cap add android

# Synchroniser
npx cap sync android

# Build APK debug
cd android
./gradlew assembleDebug

# APK généré :
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Installer l'APK

```bash
# Copier dans le stockage
cp android/app/build/outputs/apk/debug/app-debug.apk /sdcard/

# Puis depuis le gestionnaire de fichiers Android :
# Ouvrir /sdcard/app-debug.apk → Installer
```

---

## Architecture de l'app

```
missiontrack/
├── public/
│   ├── index.html     # Point d'entrée PWA
│   ├── manifest.json  # Config PWA (icône, nom, couleurs)
│   ├── sw.js          # Service Worker (mode hors-ligne)
│   └── logo.svg       # Logo de l'app
├── src/
│   ├── App.tsx                    # Routing principal
│   ├── data/
│   │   ├── types.ts               # Tous les types TypeScript
│   │   └── AppContext.tsx         # État global + CRUD
│   ├── hooks/
│   │   ├── useTime.ts             # Calculs horaires, stats mensuelles
│   │   ├── usePdfExport.ts        # Export PDF (jsPDF)
│   │   └── useServiceWorker.ts    # Enregistrement SW
│   ├── pages/
│   │   ├── MissionsPage    # Gestion multi-missions
│   │   ├── PointagePage    # Saisie quotidienne + types absences
│   │   ├── TachesPage      # Kanban léger par mission
│   │   ├── JournalPage     # Archivage actions + preuves
│   │   ├── StatistiquesPage # Graphique + export PDF
│   │   ├── ConformitePage  # 4 engagements contractuels
│   │   └── BilanPage       # Vue synthèse globale
│   └── theme/
│       └── variables.css   # Palette WCAG AA dark mode
├── capacitor.config.ts
└── package.json            # Inclut jspdf pour les PDFs
```

## Données

Toutes les données sont stockées dans `localStorage` du navigateur.
Clé : `missiontrack_v3`

Pour exporter/sauvegarder manuellement :
```javascript
// Dans la console du navigateur
copy(localStorage.getItem('missiontrack_v3'))
// Coller dans un fichier .json
```
