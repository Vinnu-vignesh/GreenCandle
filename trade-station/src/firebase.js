import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyBn9oiPWnVN_UHYkIVRogRiRgPr0rzYrLg",
  authDomain:        "greencandle-ec56f.firebaseapp.com",
  projectId:         "greencandle-ec56f",
  storageBucket:     "greencandle-ec56f.firebasestorage.app",
  messagingSenderId: "275721960039",
  appId:             "1:275721960039:web:c6fd186e466eeda71bb2c2",
  measurementId:     "G-61HMHV19NH",
};

const app = initializeApp(firebaseConfig);

export const auth          = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db            = getFirestore(app);
