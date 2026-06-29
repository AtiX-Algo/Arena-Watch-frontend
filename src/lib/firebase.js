import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhfonJX26H2tUgN3b85f9b9ys3cHJi9w0",
  authDomain: "arena-watch.firebaseapp.com",
  projectId: "arena-watch",
  storageBucket: "arena-watch.firebasestorage.app",
  messagingSenderId: "787035169808",
  appId: "1:787035169808:web:2d625ad5036d2a9e9c1695"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Database
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);