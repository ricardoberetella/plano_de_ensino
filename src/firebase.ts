import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0205976181",
  appId: "1:948743903908:web:1bf4b480253a5be5202431",
  apiKey: "AIzaSyDTRxkfHsVTF_hTQScddRKcE3mPvf_7tAE",
  authDomain: "gen-lang-client-0205976181.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-planodeensinoecr-7c6965d9-1cdd-4eb3-9dfe-4b2638800bdb",
  storageBucket: "gen-lang-client-0205976181.firebasestorage.app",
  messagingSenderId: "948743903908",
  measurementId: "",
  oAuthClientId: "948743903908-u6t8ucj5mvibsmshkjtqfnq88t82aeaa.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Autenticação anônima em segundo plano para autorizar leitura e escrita no Firestore
signInAnonymously(auth).catch((err) => {
  console.warn("Anonymous auth notice:", err);
});
