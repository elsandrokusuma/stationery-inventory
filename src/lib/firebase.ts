// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "stationery-inventory",
  "appId": "1:812550241868:web:056174a385b1539456fee9",
  "storageBucket": "stationery-inventory.firebasestorage.app",
  "apiKey": "AIzaSyDa0mHjrTK1O73yosGLrE7I5Q51eoNa3sg",
  "authDomain": "stationery-inventory.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "812550241868"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
