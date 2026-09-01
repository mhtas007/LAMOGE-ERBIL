import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAvkGebYFXJKYVTN2XXqK5O5Yr9SNBjANU",
  authDomain: "lamegocafe.firebaseapp.com",
  projectId: "lamegocafe",
  storageBucket: "lamegocafe.firebasestorage.app",
  messagingSenderId: "611781398585",
  appId: "1:611781398585:web:fbfd11e6b6d7cd12cdfde8"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager(), cacheSizeBytes: CACHE_SIZE_UNLIMITED })
});

export const auth = getAuth(app);

// Secondary app for creating users
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
