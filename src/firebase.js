// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAA7zIGi3Oe7wZHnYLPuycFBcO4wFNPLgM",
  authDomain: "group-management-551d5.firebaseapp.com",
  projectId: "group-management-551d5",
  storageBucket: "group-management-551d5.firebasestorage.app",
  messagingSenderId: "896929356912",
  appId: "1:896929356912:web:8767d6322e3c5332e4a8b5",
  measurementId: "G-6N71BG8HJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db, signInWithPopup, signOut, doc, getDoc, setDoc, collection, getDocs }
