// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRG2M3k-frqM-zuoX22O14AjHIJlTd5uo",
  authDomain: "fallynx-318cd.firebaseapp.com",
  projectId: "fallynx-318cd",
  storageBucket: "fallynx-318cd.firebasestorage.app",
  messagingSenderId: "1078412760513",
  appId: "1:1078412760513:web:36ad848a9d86a75c7ecb40",
  measurementId: "G-29WP1SK4W2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);