// firebaseConfig -> configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCkS41fgWlQGeixNm28KEb-X7_XKk0Mvk",
  authDomain: "premvida.firebaseapp.com",
  projectId: "premvida",
  storageBucket: "premvida.firebasestorage.app",
  messagingSenderId: "579815572111",
  appId: "1:579815572111:web:1a4911de66a49fd4a166fa"
};

// inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();