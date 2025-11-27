// src/services/firebase.js
// ------------------------
// Warstwa integracji z Firebase: inicjalizacja, anonimowe logowanie,
// CRUD dla nastrojów, profil użytkownika, feedback do sugestii,
// watch (live), jednorazowy odczyt do eksportu CSV.
// Uwaga: wymaga zmiennych środowiskowych Vite (plik src/.env lub .env.local)
//
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc,
  onSnapshot, query, orderBy, getDocs, limit, serverTimestamp
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';

// --- Inicjalizacja z .env (nie trzymaj twardo wpisanych danych w repo) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Prosty pomocnik: upewnij się, że mamy użytkownika anonimowego
function ensureAuthAnon() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsub(); resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsub(); resolve(cred.user);
        } catch (e) {
          unsub(); reject(e);
        }
      }
    }, reject);
  });
}

// ----------------- NASTROJE -----------------

// Zapis jednego wpisu nastroju do chmury (users/{uid}/moods/{autoId})
export async function saveMoodRemote(entry) {
  const user = await ensureAuthAnon();
  const ref = collection(db, 'users', user.uid, 'moods');
  // Trzymamy zarówno ts:number (ułatwia sort w kliencie) jak i createdAt:serverTimestamp
  const payload = {
    ts: typeof entry.ts === 'number' ? entry.ts : Date.now(),
    input: entry.input || '',
    emotion: entry.emotion || '',
    intensity: entry.intensity ?? null,
    suggestion: entry.suggestion || null
  };
  await addDoc(ref, { ...payload, createdAt: serverTimestamp() });
}

// Nasłuchiwanie live historii nastrojów bieżącego usera (posortowane malejąco)
export function watchMoodsRemote({ onData, onError, max = 500 }) {
  // Uwaga: onAuthStateChanged jest asynchroniczne – poniżej łączymy to w prostą logikę
  let unsubAuth = null;
  let unsubQuery = null;

  unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) {
      // jeśli jeszcze brak – włącz anonimowe logowanie i poczekaj
      signInAnonymously(auth).catch(onError);
      return;
    }
    // posortuj po ts (liczbowo) lub createdAt (fallback)
    const moodsRef = collection(db, 'users', user.uid, 'moods');
    const q = query(moodsRef, orderBy('ts', 'desc'), limit(max));
    unsubQuery = onSnapshot(q, (snap) => {
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      onData(rows);
    }, onError);
  }, onError);

  // Zwróć funkcję do odpięcia nasłuchiwania
  return () => {
    if (unsubQuery) unsubQuery();
    if (unsubAuth) unsubAuth();
  };
}

// Jednorazowy odczyt (do eksportu CSV)
export async function fetchMoodsOnce(max = 2000) {
  const user = await ensureAuthAnon();
  const moodsRef = collection(db, 'users', user.uid, 'moods');
  // Pobierz dużą porcję – jeśli kiedyś będzie bardzo dużo danych, dodaj paginację
  const qy = query(moodsRef, orderBy('ts', 'desc'), limit(max));
  const snap = await getDocs(qy);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

// (Opcjonalne) kasowanie wszystkich nastrojów użytkownika
export async function deleteAllMoodsRemote() {
  const user = await ensureAuthAnon();
  const moods = await fetchMoodsOnce(5000);
  // Uwaga: przy bardzo dużej liczbie lepiej użyć funkcji chmurowej (batch/recursive delete)
  for (const m of moods) {
    // Nie załączam deleteDoc, żeby nie zmieniać uprawnień; dodasz gdy będziesz potrzebować
    // await deleteDoc(doc(db, 'users', user.uid, 'moods', m.id));
    console.warn('deleteAllMoodsRemote: wstaw deleteDoc, jeśli chcesz fizycznie usuwać.');
  }
}

// --------------- FEEDBACK SUGESTII ---------------

// Zapis oceny (kciuk w górę/dół) do kolekcji 'feedback'
export async function saveSuggestionFeedback({ suggestionId, title, emotion, ts, vote }) {
  const user = await ensureAuthAnon();
  const ref = collection(db, 'feedback');
  await addDoc(ref, {
    uid: user.uid,
    suggestionId: suggestionId || null,
    title: title || '',
    emotion: emotion || '',
    ts: ts || Date.now(),
    vote: vote === 'up' ? 'up' : 'down',
    createdAt: serverTimestamp()
  });
}

// --------------- PROFIL UŻYTKOWNIKA ---------------

// users/{uid}/profile/main – trzymamy preferencje/profil w jednym dokumencie
export async function loadProfile() {
  const user = await ensureAuthAnon();
  const d = await getDoc(doc(db, 'users', user.uid, 'profile', 'main'));
  return d.exists() ? d.data() : null;
}

export async function saveProfile(data) {
  const user = await ensureAuthAnon();
  await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
