import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdLvWFeDZZPlhg92hLZeCDC3hd8JGPUHI",
  authDomain: "myworldmao-e78bf.firebaseapp.com",
  projectId: "myworldmao-e78bf",
  storageBucket: "myworldmao-e78bf.appspot.com",
  messagingSenderId: "190362323934",
  appId: "1:190362323934:web:2ffe9286a7f64d0495eb4f",
  measurementId: "G-ZLKB2BK8TL"
};

// Initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
