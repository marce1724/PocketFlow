import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import type { budgetState } from "../reducers/budget-reducer";

const COLLECTION = "appState";
const DOC_ID = "main";

// Helper to convert Dates to strings in a deep clone
function serializeDates(state: budgetState): any {
  return {
    ...state,
    expenses: state.expenses.map(exp => ({
      ...exp,
      date: exp.date instanceof Date ? exp.date.toISOString() : exp.date,
    })),
  };
}

export async function saveAppState(state: budgetState) {
  if (!db) return;
  const ref = doc(db, COLLECTION, DOC_ID);
  const safeState = serializeDates(state);
  await setDoc(ref, safeState);
}

export async function loadAppState(): Promise<budgetState | null> {
  if (!db) return null;
  const ref = doc(db, COLLECTION, DOC_ID);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as budgetState) : null;
}