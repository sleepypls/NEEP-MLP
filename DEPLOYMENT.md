# Hosting & Deployment Guide

This guide explains how to host your **NEEP-MLP Pickleball Tracker** online for free, connect **Google Firebase Firestore** for real-time multiplayer scoring, and share links with players.

---

## Step 1: Deploy Frontend Online (Free on Vercel or Netlify)

### Option A: 1-Click Deploy on Vercel (Recommended)
1. Push this project folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "NEEP-MLP v2.0 - Vite + Firebase"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com/)** and sign in with GitHub.
3. Click **"Add New Project"** &rarr; Select your `NEEP-MLP` repository.
4. Framework Preset will automatically detect **Vite**.
5. Click **"Deploy"**. Within 60 seconds, your site will be live at:
   `https://your-project.vercel.app`

---

## Step 2: Set Up Free Google Firebase Firestore

Firebase provides real-time WebSockets so that when scores are updated on court, every spectator's phone updates instantly without page refreshes.

1. Go to **[console.firebase.google.com](https://console.firebase.google.com/)** and sign in with your Google account.
2. Click **"Add project"** and give it a name (e.g., `neep-pickleball`). (Google Analytics is optional).
3. In the project dashboard, click **"Firestore Database"** in the left sidebar &rarr; **"Create database"**.
   - Choose your nearest cloud region (e.g. `us-central` or `australia-southeast1`).
   - Start in **Test mode** (allows read/writes during tournaments).
4. Register a Web App:
   - In Project Overview, click the Web icon (`</>`).
   - Name it `NEEP Tracker` &rarr; click **"Register app"**.
   - Copy the `firebaseConfig` snippet. It will look like this:
     ```json
     {
       "apiKey": "AIzaSy...",
       "authDomain": "neep-pickleball.firebaseapp.com",
       "projectId": "neep-pickleball",
       "storageBucket": "neep-pickleball.appspot.com",
       "messagingSenderId": "...",
       "appId": "..."
     }
     ```

---

## Step 3: Connect Firebase to Your App

You can connect Firebase in either of two ways:

### Method 1: Directly in the Web App (Easiest)
1. Open your deployed site (or local app).
2. Click the cloud pill in the header (**"Local"** / 🟡).
3. Paste the `firebaseConfig` JSON into the text box.
4. Click **"Save & Connect"**. The pill will turn green (**"Cloud Live"** 🟢) and real-time multiplayer syncing is active immediately!

### Method 2: Via Environment Variables in Vercel
In your Vercel Project Settings &rarr; **Environment Variables**, add:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## Step 4: Sharing Links with Players

Click the **Share** button in the header to get two links:

1. **Spectator Link (For Players & Spectators)**:
   - `https://your-site.vercel.app/?mode=spectator`
   - Players can view court matchups, live scores, bracket progress, and partnership standings on their phones. Score editing is disabled so nobody can accidentally change a score.

2. **Scorekeeper Link (For Organizers)**:
   - `https://your-site.vercel.app/?mode=admin&pin=1234`
   - Unlocks full access to draft players, score regulation games, randomize extra games, and run Dreambreakers.
