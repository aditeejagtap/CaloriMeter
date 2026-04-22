// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence,} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDFwhCM-4Q0dKSHOY9q4o1qPl9MvVrM4sU',
  authDomain: 'calorimeter-39c14.firebaseapp.com',
  projectId: 'calorimeter-39c14',
  storageBucket: 'calorimeter-39c14.firebasestorage.app',
  messagingSenderId: '411401020643',
  appId: '1:411401020643:web:b34d5a3fd4902d742511d6',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Set auth persistence to LOCAL (survives browser refresh and tab close)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Auth persistence error:', error);
});
