import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBUqUsM-LLsp9vW3FQOVzgD6tGZkk7aw98",
  authDomain: "www.atechutem.com",
  databaseURL: "https://zingoprj01-training-site-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zingoprj01-training-site",
  storageBucket: "zingoprj01-training-site.firebasestorage.app",
  messagingSenderId: "975750119401",
  appId: "1:975750119401:web:6017dc86a7b31b20861578",
  measurementId: "G-CBN8CV1W3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-southeast1");
