import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function firebaseConfig(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }
  if (apiKey.includes("YOUR_")) return null;
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

let app: FirebaseApp | null | undefined;
let db: Firestore | null | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  if (app !== undefined) return app;
  const config = firebaseConfig();
  app = config ? initializeApp(config) : null;
  return app;
}

export function getDb(): Firestore | null {
  if (db !== undefined) return db;
  const firebaseApp = getFirebaseApp();
  db = firebaseApp ? getFirestore(firebaseApp) : null;
  return db;
}

export function isCloudEnabled(): boolean {
  return getDb() !== null;
}
