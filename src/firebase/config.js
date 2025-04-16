import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDrjQG3Be61p03uDG-vjP9zoIcEVI-fyQk",
    authDomain: "app1base-8a8ac.firebaseapp.com",
    databaseURL: "https://app1base-8a8ac-default-rtdb.firebaseio.com",
    projectId: "app1base-8a8ac",
    storageBucket: "app1base-8a8ac.firebasestorage.app",
    messagingSenderId: "791621171816",
    appId: "1:791621171816:web:b13bd9d060ed7c26ee19dd",
    measurementId: "G-8QRRB40X9R"
    };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
