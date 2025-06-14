// budget-reducer.ts

import { CategoryBudgets, Category, DraftExpense, Expense } from "../types"; // Import Value type
import { v4 as uuidv4 } from "uuid";

// --- Action Types --- (No changes)
export type budgetActions =
    | { type: "add-budget"; payload: { budget: number; CategoryBudgets: CategoryBudgets[] } }
    | { type: "show-modal" }
    | { type: "close-modal" }
    | { type: "add-expense"; payload: { expense: DraftExpense } }
    | { type: "remove-expense"; payload: { id: Expense["id"] } }
    | { type: "get-expense-by-id"; payload: { id: Expense["id"] } }
    | { type: "update-expense"; payload: { expense: Expense } }
    | { type: "add-filter-category"; payload: { id: Category["id"] } }
    | { type: "reset-app" }
    | { type: "transfer-budget"; payload: { from: Category["id"]; to: Category["id"]; amount: number } }
    | { type: "load-from-db"; payload: budgetState };

// --- State Type --- (No changes)
export type budgetState = {
    budget: number;
    CategoryBudgets: CategoryBudgets[];
    modal: boolean;
    expenses: Expense[];
    editingId: Expense["id"];
    currentCategory: Category["id"];
};

// --- Default State --- (No changes)
export const defaultState: budgetState = {
    budget: 0,
    CategoryBudgets: [],
    modal: false,
    expenses: [],
    editingId: "",
    currentCategory: "",
};

// --- State Initialization ---
// const loadState = (): budgetState => {
//     const localStorageState = localStorage.getItem("budgetState");
//     if (localStorageState) {
//         try {
//             // JSON.parse returns 'any'
//             const parsedState = JSON.parse(localStorageState);

//             // Basic validation
//             if (
//                 parsedState !== null && typeof parsedState === 'object' &&
//                 typeof parsedState.budget === 'number' &&
//                 Array.isArray(parsedState.CategoryBudgets) &&
//                 typeof parsedState.modal === 'boolean' &&
//                 Array.isArray(parsedState.expenses) &&
//                 typeof parsedState.editingId === 'string' &&
//                 typeof parsedState.currentCategory === 'string'
//             ) {
//                 // Convert expense date strings back to Date objects
//                 // Explicitly type 'expense' parameter in map callback (Option 2)
//                 const expensesWithDates = parsedState.expenses.map((expense: {
//                     id: string;
//                     expenseName: string;
//                     amount: number;
//                     category: string;
//                     date: string | null | Date; // Expect date to be string or null from JSON
//                 }): Expense => {

//                     // Return a well-typed Expense object
//                     return {
//                         // Use || operators as fallback for potentially missing properties from storage
//                         id: expense.id || uuidv4(),
//                         expenseName: expense.expenseName || "",
//                         // Ensure amount is a number
//                         amount: expense.amount,
//                         category: expense.category || "",
//                         date:
//                             expense.date instanceof Date && !isNaN(expense.date.getTime())
//                                 ? expense.date
//                                 : typeof expense.date === 'string'
//                                     ? new Date(expense.date)
//                                     : new Date(), // fallback if null or undefined
//                     };
//                 });

//                 // Return the state with the corrected expenses array
//                 return {
//                     budget: parsedState.budget,
//                     CategoryBudgets: parsedState.CategoryBudgets,
//                     modal: parsedState.modal,
//                     editingId: parsedState.editingId,
//                     currentCategory: parsedState.currentCategory,
//                     expenses: expensesWithDates // Use the array with Date objects
//                 } as budgetState;

//             } else {
//                 console.warn("Stored state structure is invalid or incomplete. Resetting to default.");
//             }
//         } catch (e) {
//             console.error("Error parsing state from localStorage or converting dates. Using default state.", e);
//         }
//     }
//     return defaultState;
// };

// export const initialState: budgetState = loadState();

export const initialState: budgetState = {
    budget: 0,
    CategoryBudgets: [],
    modal: false,
    expenses: [],
    editingId: "",
    currentCategory: "",
};
  
// --- Helper Functions --- (Ensure date is valid Date object or null)
const createExpense = (draftExpense: DraftExpense): Expense => {
    return { ...draftExpense, date: draftExpense.date, id: uuidv4() };
};

// --- Reducer Function ---
export const budgetReducer = (
    state: budgetState = initialState,
    action: budgetActions
): budgetState => {
    switch (action.type) {
        case "load-from-db": {
            const parsedExpenses = action.payload.expenses.map(exp => ({
                ...exp,
                date: typeof exp.date === "string" ? new Date(exp.date) : exp.date,
            }));

            return {
                ...state,
                ...action.payload,
                expenses: parsedExpenses,
            };
        }
        case "transfer-budget": {
            const { from, to, amount } = action.payload;

            const updatedCategoryBudgets = state.CategoryBudgets.map(b => {
                if (b.id === from) return { ...b, value: b.value - amount };
                if (b.id === to) return { ...b, value: b.value + amount };
                return b;
            });

            return { ...state, CategoryBudgets: updatedCategoryBudgets };
        }
            
        case "add-budget": {
            const spentPerCategory = state.expenses.reduce((acc, expense) => { acc[expense.category] = (acc[expense.category] || 0) + expense.amount; return acc; }, {} as Record<string, number>);
            const updatedCategoryBudgets = action.payload.CategoryBudgets.map(cb => ({ ...cb, value: cb.value- (spentPerCategory[cb.id] || 0) }));
            return { ...state, budget: action.payload.budget, CategoryBudgets: updatedCategoryBudgets };
        }

        case "show-modal": return { ...state, modal: true };
        case "close-modal": return { ...state, modal: false, editingId: "" };

        case "add-expense": {
            const expense = createExpense(action.payload.expense);
            const expenseAmount = expense.amount;

            const updatedCategoryBudgets = state.CategoryBudgets.map(b => b.id === expense.category ? { ...b, value: (b.value || 0) - expenseAmount } : b);
            return { ...state, expenses: [...state.expenses, expense], CategoryBudgets: updatedCategoryBudgets, modal: false };
        }

        case "remove-expense": {
            const expenseToRemove = state.expenses.find(ex => ex.id === action.payload.id);
            if (!expenseToRemove) return state;
            const removedAmount = expenseToRemove.amount;
            const updatedCategoryBudgets = state.CategoryBudgets.map(b => b.id === expenseToRemove.category ? { ...b, value: (b.value || 0) + removedAmount } : b);
            const updatedExpenses = state.expenses.filter(ex => ex.id !== action.payload.id);
            return { ...state, expenses: updatedExpenses, CategoryBudgets: updatedCategoryBudgets };
        }

        case "get-expense-by-id": return { ...state, editingId: action.payload.id, modal: true };

        case "update-expense": {
            const updated = action.payload.expense;
            const original = state.expenses.find(ex => ex.id === updated.id);
            if (!original) return state;

            // Normalize date safely
            const parseDate = (d: unknown): Date | null => {
                if (d instanceof Date && !isNaN(d.getTime())) return d;
                if (typeof d === 'string') {
                    const parsed = new Date(d);
                    return isNaN(parsed.getTime()) ? null : parsed;
                }
                return null;
            };

            const finalDate =
                parseDate(updated.date) ??
                parseDate(original.date) ??
                new Date(); // fallback

            const updatedExpense = { ...updated, date: finalDate };

            const updatedCategoryBudgets = state.CategoryBudgets.map(b => {
                if (original.category === updated.category && b.id === updated.category) {
                    return {
                        ...b,
                        value: b.value + original.amount - updated.amount
                    };
                }

                if (b.id === original.category) {
                    return { ...b, value: b.value + original.amount };
                }

                if (b.id === updated.category) {
                    return { ...b, value: b.value - updated.amount };
                }

                return b;
              });

            const updatedExpenses = state.expenses.map(ex =>
                ex.id === updatedExpense.id ? updatedExpense : ex
            );

            return {
                ...state,
                expenses: updatedExpenses,
                CategoryBudgets: updatedCategoryBudgets,
                modal: false,
                editingId: "",
            };
        }

        case "reset-app": return defaultState;
        case "add-filter-category": return { ...state, currentCategory: action.payload.id };
        default: return state;
    }
};