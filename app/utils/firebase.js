
import { initializeApp } from "firebase/app";
import { getAnalytics} from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCk-Wytdc4yQGDPZwRP-5SwWP5aAX24mx8",
  authDomain: "anzamanagementsystem.firebaseapp.com",
  projectId: "anzamanagementsystem",
  storageBucket: "anzamanagementsystem.appspot.com",
  messagingSenderId: "431008951750",
  appId: "1:431008951750:web:8bbe2986afcaf004cfd6c7",
  measurementId: "G-CQHJWZZQVL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const firestore = getFirestore(app);
