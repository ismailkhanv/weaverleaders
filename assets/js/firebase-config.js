/**
 * Firebase Configuration Module
 * Loaded globally via script tag (compat version)
 */

// Intercept and suppress Firestore deprecation warnings to keep the console clean
(function() {
    const originalWarn = console.warn;
    console.warn = function (...args) {
        const hasDeprecation = args.some(arg => typeof arg === 'string' && (arg.includes('enableIndexedDbPersistence') || arg.includes('FirestoreSettings.cache')));
        if (hasDeprecation) {
            return;
        }
        originalWarn.apply(console, args);
    };
})();

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
firebase.firestore.setLogLevel('error');

// Enable offline persistence for faster subsequent reads and snapshot loading
if (typeof firebase !== 'undefined' && firebase.firestore) {
    db.enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Firestore persistence failed-precondition: multiple tabs open.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firestore persistence is unimplemented in the current browser.");
            }
        });
}

const auth = firebase.auth();

// Expose globally
window.db = db;
window.auth = auth;

