
// src/firebase-config.ts
import { initializeApp, FirebaseApp } from "firebase/app"; // Importar FirebaseApp
import { getFirestore, Firestore } from "firebase/firestore"; // Importar Firestore

// --- Leer Variables de Entorno ---
// Vite usa import.meta.env
// CRA y Node.js usan process.env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? process.env.REACT_APP_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ?? process.env.FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? process.env.REACT_APP_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ?? process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ?? process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? process.env.REACT_APP_FIREBASE_APP_ID ?? process.env.FIREBASE_APP_ID;

// Verificar que todas las variables necesarias estén presentes
if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  console.error("Error: Faltan variables de entorno de configuración de Firebase.");
  // Puedes lanzar un error o manejarlo como prefieras
  // throw new Error("Faltan variables de entorno de Firebase.");
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// --- Inicializar Firebase y Validar Conexión ---
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  // Si llegamos aquí, la inicialización básica fue exitosa
  console.log("Conexión con Firebase inicializada exitosamente.");
  console.log(`   -> Proyecto: ${firebaseConfig.projectId}`); // Muestra el ID del proyecto para confirmar

  // Opcional: Podrías intentar una operación simple (como leer un documento conocido)
  // para una validación más profunda, pero usualmente la inicialización es suficiente.

} catch (error) {
  console.error(" Error al inicializar Firebase:", error);
  // La aplicación podría no funcionar correctamente sin Firebase
  // Puedes decidir si lanzar el error o permitir que la app continúe (con db siendo null)
  app = null;
  db = null;
}

// Exporta la instancia de DB (puede ser null si falló la conexión)
// Los componentes que usen 'db' deberán verificar si no es null.
export { db, app }; // Exportamos 'app' también por si se necesita