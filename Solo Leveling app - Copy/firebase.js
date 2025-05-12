// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3fY1zmbJDBInid3LCDH7c3DI3DJFoL-I",
  authDomain: "solo-leveling-dc9a7.firebaseapp.com",
  projectId: "solo-leveling-dc9a7",
  storageBucket: "solo-leveling-dc9a7.firebasestorage.app",
  messagingSenderId: "371613870478",
  appId: "1:371613870478:web:18d03e270fedb4606bdcdf",
  measurementId: "G-KZHEJZ7T7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);