# Mission Inetum — Dashboard de suivi
**TRAORE OUSMANA · Avril 2026 – Avril 2027**

Application Ionic React pour le suivi de mission : pointage des heures, conformité contractuelle, journal des actions et bilan.

---

## 🚀 Build sur Termux (Android)

### 1. Installer les dépendances Termux

```bash
# Mettre à jour les paquets
pkg update && pkg upgrade

# Installer Node.js et les outils nécessaires
pkg install nodejs-lts

# Vérifier la version (Node >= 16 requis)
node --version
npm --version
```

### 2. Cloner / transférer le projet

```bash
# Créer le dossier et transférer les fichiers
# (via adb, SSH, ou manuellement depuis le stockage)
cd ~
mkdir inetum-mission
# Copier les fichiers dans ~/inetum-mission/
```

### 3. Installer les dépendances npm

```bash
cd ~/inetum-mission
npm install
```

> ⚠️ Sur Termux, si vous avez des erreurs de mémoire :
> ```bash
> node --max-old-space-size=512 node_modules/.bin/react-scripts build
> ```

### 4. Build de production (web)

```bash
npm run build
```

Le dossier `build/` contient l'application web statique.

### 5. Tester localement dans Termux

```bash
# Installer un serveur HTTP simple
npm install -g serve

# Servir le build
serve -s build -l 3000
```

Ouvrir `http://localhost:3000` dans le navigateur Android.

---

## 📱 Build APK avec Capacitor (Android natif)

### Prérequis supplémentaires

```bash
# Java Development Kit (requis pour Gradle)
pkg install openjdk-17

# Android SDK — via Termux-Android-Tools ou manuellement
# Voir : https://github.com/Lzhiyong/termux-ndk

# Variables d'environnement (à ajouter dans ~/.bashrc)
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Étapes build APK

```bash
# 1. Build React
npm run build

# 2. Ajouter la plateforme Android (première fois seulement)
npx cap add android

# 3. Synchroniser le build dans Capacitor
npx cap sync android

# 4. Build APK debug
cd android
./gradlew assembleDebug

# L'APK se trouve dans :
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Installer l'APK sur l'appareil

```bash
# Via ADB (si connecté en USB)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou copier manuellement dans le stockage et installer via le gestionnaire de fichiers
cp android/app/build/outputs/apk/debug/app-debug.apk /sdcard/
```

---

## 🌐 Mode PWA (recommandé sans Android SDK)

Sans Android SDK, l'application peut fonctionner comme une **PWA (Progressive Web App)** directement dans Chrome Android :

```bash
npm run build
serve -s build -l 8080
```

1. Ouvrir Chrome → `http://localhost:8080`
2. Menu Chrome → "Ajouter à l'écran d'accueil"
3. L'app s'installe comme une application native

---

## 📁 Structure du projet

```
inetum-mission/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.tsx              # Routing Ionic + tabs
│   ├── index.tsx            # Entry point
│   ├── data/
│   │   └── constants.ts     # Jours fériés, types, engagements
│   ├── hooks/
│   │   ├── useStorage.ts    # Persistance localStorage
│   │   └── useTime.ts       # Calculs horaires
│   ├── pages/
│   │   ├── PointagePage.tsx  # Saisie des heures par semaine
│   │   ├── ConformitePage.tsx # Suivi des 4 engagements
│   │   ├── JournalPage.tsx   # Journal des actions avec preuves
│   │   └── BilanPage.tsx     # Bilan + contacts
│   └── theme/
│       └── variables.css    # Thème Ionic dark
├── capacitor.config.ts
├── package.json
└── tsconfig.json
```

---

## ✨ Fonctionnalités

| Module | Fonctionnalités |
|--------|----------------|
| **Pointage** | Navigation semaine par semaine, saisie arrivée/départ/pause, calcul automatique, alertes repos 11h/35h, jours fériés 2026-2027 |
| **Conformité** | 4 engagements (Confidentialité, Sécurité GMS GU410, RGPD, Santé), statut Conforme/Partiel/NC, champ preuve, score global |
| **Journal** | Ajout d'entrées horodatées avec titre, détail et référence de preuve, suppression avec confirmation |
| **Bilan** | KPIs, récap conformité, paramètres mission, contacts clés, rappels réglementaires |

Toutes les données sont **sauvegardées localement** via `localStorage` (persistant entre les sessions).

---

## 🔧 Scripts disponibles

```bash
npm start          # Développement (hot reload)
npm run build      # Build production
npx cap sync       # Synchroniser avec Capacitor
npx cap open android  # Ouvrir dans Android Studio (si disponible)
```
