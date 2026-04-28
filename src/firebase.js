// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAOlzM55dkUftgIMjHhY2bwf-DrCB-gc4g",
  authDomain: "event-count-down-e6803.firebaseapp.com",
  projectId: "event-count-down-e6803",
  storageBucket: "event-count-down-e6803.firebasestorage.app",
  messagingSenderId: "9196372018",
  appId: "1:9196372018:web:3a479e7fcba156f3307c2b",
  measurementId: "G-CR0D5S5T1T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
