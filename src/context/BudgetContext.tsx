
import { useState, useReducer, createContext, Dispatch, ReactNode, useMemo, useEffect } from "react";
import { budgetActions, budgetReducer, budgetState, initialState } from "../reducers/budget-reducer"
import { db } from "../firebase-config"; // adjust path if needed
import { doc, getDoc } from "firebase/firestore";

type BudgetContextProps = {
    state: budgetState
    dispatch: Dispatch<budgetActions>
    totalExpenses: number
    remainingBudget: number,
    hasLoadedFromFirebase: boolean;
}

type BudgetProviderProps = {
    children: ReactNode
}

export const BudgetContext = createContext<BudgetContextProps>(null!)

export const BudgetProvider = ({ children }: BudgetProviderProps) => {
    const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);
    const [state, dispatch] = useReducer(budgetReducer, initialState);

    const totalExpenses = useMemo(() => state.expenses.reduce((total, expense) => expense.amount + total, 0), [state.expenses]);
    const remainingBudget = state.budget - totalExpenses;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db!, "appState", "main");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const raw = snapshot.data() as budgetState;
                    const normalizedExpenses = raw.expenses.map(exp => ({
                        ...exp,
                        date: new Date(exp.date),
                    }));
                    dispatch({ type: "load-from-db", payload: { ...raw, expenses: normalizedExpenses } });
                }
            } catch (error) {
                console.error("Failed to fetch initial state from Firebase:", error);
            } finally {
                setHasLoadedFromFirebase(true);
            }
        };
        fetchData();
    }, []);

    return (
        <BudgetContext.Provider
            value={{
                state,
                dispatch,
                totalExpenses,
                remainingBudget,
                hasLoadedFromFirebase, // ⬅️ Expose it here
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
  };