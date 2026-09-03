import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';

const STORAGE_KEY_FIREBASE_CONFIG = 'neep_firebase_config_v1';
const DEFAULT_CLUB_ID = 'neep-pickleball';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCkbXjIwd0BLRpR3Q5YkUR3p8DXfJQa5B0",
  authDomain: "neep-pb-tracker.firebaseapp.com",
  projectId: "neep-pb-tracker",
  storageBucket: "neep-pb-tracker.firebasestorage.app",
  messagingSenderId: "483596216306",
  appId: "1:483596216306:web:40f0f884fbc2436257ed6b",
  measurementId: "G-VWBYTCV1JE"
};

// Try loading config from env vars, localStorage, or fallback to default
export function getFirebaseConfig() {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (fromStorage === 'disabled') {
      return null;
    }
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (e) {
    // ignore
  }

  // Check Vite env variables
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config) {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    } else {
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, 'disabled');
    }
  } catch (e) {
    // ignore
  }
}

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
    return null;
  }
}

export function isCloudEnabled() {
  return getDb() !== null;
}

// ---------------- Realtime Listeners ----------------

export function subscribeToActiveTournament(clubId = DEFAULT_CLUB_ID, onUpdate, onError) {
  const db = getDb();
  if (!db) return () => {};

  const tournamentDocRef = doc(db, 'clubs', clubId, 'tournaments', 'active');
  return onSnapshot(
    tournamentDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('[Firebase] Tournament listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToStats(clubId = DEFAULT_CLUB_ID, onUpdate, onError) {
  const db = getDb();
  if (!db) return () => {};

  const statsDocRef = doc(db, 'clubs', clubId, 'data', 'stats');
  return onSnapshot(
    statsDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          playerStats: data.playerStats || {},
          partnershipStats: data.partnershipStats || {},
        });
      }
    },
    (err) => {
      console.warn('[Firebase] Stats listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToKnownPlayers(clubId = DEFAULT_CLUB_ID, onUpdate) {
  const db = getDb();
  if (!db) return () => {};

  const playersDocRef = doc(db, 'clubs', clubId, 'data', 'players');
  return onSnapshot(
    playersDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data().roster || []);
      }
    },
    (err) => {
      console.warn('[Firebase] Players listener error:', err);
    }
  );
}

// ---------------- Document Writers ----------------

export async function saveTournamentToCloud(clubId = DEFAULT_CLUB_ID, tournamentState) {
  const db = getDb();
  if (!db || !tournamentState) return;

  try {
    const tournamentDocRef = doc(db, 'clubs', clubId, 'tournaments', 'active');
    await setDoc(tournamentDocRef, {
      ...tournamentState,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Error saving tournament to cloud:', err);
  }
}

export async function saveStatsToCloud(clubId = DEFAULT_CLUB_ID, playerStats, partnershipStats) {
  const db = getDb();
  if (!db) return;

  try {
    const statsDocRef = doc(db, 'clubs', clubId, 'data', 'stats');
    await setDoc(statsDocRef, {
      playerStats: playerStats || {},
      partnershipStats: partnershipStats || {},
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Error saving stats to cloud:', err);
  }
}

export async function saveKnownPlayersToCloud(clubId = DEFAULT_CLUB_ID, roster) {
  const db = getDb();
  if (!db) return;

  try {
    const playersDocRef = doc(db, 'clubs', clubId, 'data', 'players');
    await setDoc(playersDocRef, {
      roster: roster || [],
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Error saving players to cloud:', err);
  }
}
