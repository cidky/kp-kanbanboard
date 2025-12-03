import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyARMkZjJujplWTp8k1-0TUA09RneTb8MCo",
  authDomain: "kanban-board-d4441.firebaseapp.com",
  projectId: "kanban-board-d4441",
  storageBucket: "kanban-board-d4441.appspot.app",
  messagingSenderId: "88339828235",
  appId: "1:88339828235:web:9feee33e157363b788410e",
  measurementId: "G-C25PQXRS5B",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
