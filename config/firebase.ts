// Firebase Web SDK Configuration (works with Expo Go, no CocoaPods needed)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlDLAK6916ZxgoJufdi4Koq0INhGIFkY8",
  authDomain: "mindful-moves.firebaseapp.com",
  projectId: "mindful-moves",
  storageBucket: "mindful-moves.firebasestorage.app",
  messagingSenderId: "569801083136",
  appId: "1:569801083136:web:58f285b7a373c56ddecbe5",
  measurementId: "G-T8N5FMPGVC"
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
