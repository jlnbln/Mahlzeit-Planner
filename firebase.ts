import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: REPLACE THIS WITH YOUR FIREBASE CONFIG FROM THE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyDSliWlYP-4EF3c4pM1ShghToNjwV6vnes",
  authDomain: "mahlzeitplanner.firebaseapp.com",
  projectId: "mahlzeitplanner",
  storageBucket: "mahlzeitplanner.firebasestorage.app",
  messagingSenderId: "648464740872",
  appId: "1:648464740872:web:2aee942aff4691afef57bd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);