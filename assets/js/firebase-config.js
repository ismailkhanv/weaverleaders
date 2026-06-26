/**
 * Firebase Configuration Module
 * Loaded globally via script tag (compat version)
 */

const firebaseConfig = {
    apiKey: "AIzaSyDONWSlKhcrp8FALYU-Ukd9FRi3B-vlvr8",
    authDomain: "weaverleaders.firebaseapp.com",
    projectId: "weaverleaders",
    storageBucket: "weaverleaders.firebasestorage.app",
    messagingSenderId: "67035791551",
    appId: "1:67035791551:web:ae2c1d62b4ba6c22ab060a",
    measurementId: "G-CF9G83QP8T"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Expose globally
window.db = db;
window.auth = auth;

