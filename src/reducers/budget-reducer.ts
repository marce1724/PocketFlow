// budget-reducer.ts

import { CategoryBudgets, Category, DraftExpense, Expense, Value } from "../types"; // Import Value type
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
    | { type: "reset-app" };

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
const defaultState: budgetState = {
    budget: 0,
    CategoryBudgets: [],
    modal: false,
    expenses: [],
    editingId: "",
    currentCategory: "",
};

// --- State Initialization --- (MODIFIED loadState)
const loadState = (): budgetState => {
    const localStorageState = localStorage.getItem("budgetState");
    if (localStorageState) {
        try {
            // JSON.parse returns 'any'
            const parsedState = JSON.parse(localStorageState);

            // Basic validation
            if (
                parsedState !== null && typeof parsedState === 'object' &&
                typeof parsedState.budget === 'number' &&
                Array.isArray(parsedState.CategoryBudgets) &&
                typeof parsedState.modal === 'boolean' &&
                Array.isArray(parsedState.expenses) &&
                typeof parsedState.editingId === 'string' &&
                typeof parsedState.currentCategory === 'string'
            ) {
                // Convert expense date strings back to Date objects
                // Explicitly type 'expense' parameter in map callback (Option 2)
                const expensesWithDates = parsedState.expenses.map((expense: {
                    id: string;
                    expenseName: string;
                    amount: number;
                    category: string;
                    date: string | null | Date; // Expect date to be string or null from JSON
                }): Expense => {

                    let convertedDate: Value | null = null; // Use Value type from types.ts

                    if (expense.date && typeof expense.date === 'string') {
                        const dateObj = new Date(expense.date);
                        if (!isNaN(dateObj.getTime())) {
                            convertedDate = dateObj;
                        } else {
                            console.warn(`Invalid date string for expense ${expense.id}:`, expense.date);
                            convertedDate = null;
                        }
                    } else if (expense.date === null) {
                        convertedDate = null;
                    } else if (expense.date instanceof Date && !isNaN(expense.date.getTime())){
                        // Handle case where it might somehow already be a valid Date
                        convertedDate = expense.date;
                    }

                    // Return a well-typed Expense object
                    return {
                        // Use || operators as fallback for potentially missing properties from storage
                        id: expense.id || uuidv4(),
                        expenseName: expense.expenseName || "",
                        // Ensure amount is a number
                        amount: typeof expense.amount === 'number' ? expense.amount : 0,
                        category: expense.category || "",
                        date: convertedDate, // Use the converted Date object or null
                    };
                });

                // Return the state with the corrected expenses array
                return {
                    budget: parsedState.budget,
                    CategoryBudgets: parsedState.CategoryBudgets,
                    modal: parsedState.modal,
                    editingId: parsedState.editingId,
                    currentCategory: parsedState.currentCategory,
                    expenses: expensesWithDates // Use the array with Date objects
                } as budgetState;

            } else {
                console.warn("Stored state structure is invalid or incomplete. Resetting to default.");
            }
        } catch (e) {
            console.error("Error parsing state from localStorage or converting dates. Using default state.", e);
        }
    }
    return defaultState;
};
export const initialState: budgetState = loadState();

// --- Helper Functions --- (Ensure date is valid Date object or null)
const createExpense = (draftExpense: DraftExpense): Expense => {
    let dateToSave: Date | null = null;
     if (draftExpense.date instanceof Date && !isNaN(draftExpense.date.getTime())) { dateToSave = draftExpense.date; }
     else if (typeof draftExpense.date === 'string') {
         const parsed = new Date(draftExpense.date);
         if (!isNaN(parsed.getTime())) { dateToSave = parsed; }
     }
     if (!dateToSave) { dateToSave = new Date(); }

    return { ...draftExpense, date: dateToSave, id: uuidv4() };
};

// --- Reducer Function ---
export const budgetReducer = (
    state: budgetState = initialState,
    action: budgetActions
): budgetState => {
    switch (action.type) {
        case "add-budget": {
            const spentPerCategory = state.expenses.reduce((acc, expense) => { acc[expense.category] = (acc[expense.category] || 0) + (typeof expense.amount === 'number' ? expense.amount : 0); return acc; }, {} as Record<string, number>);
            const updatedCategoryBudgets = action.payload.CategoryBudgets.map(cb => ({ ...cb, value: (typeof cb.value === 'number' ? cb.value : 0) - (spentPerCategory[cb.id] || 0) }));
            return { ...state, budget: typeof action.payload.budget === 'number' ? action.payload.budget : 0, CategoryBudgets: updatedCategoryBudgets };
        }

        case "show-modal": return { ...state, modal: true };
        case "close-modal": return { ...state, modal: false, editingId: "" };

        case "add-expense": {
            const expense = createExpense(action.payload.expense);
            const expenseAmount = typeof expense.amount === 'number' ? expense.amount : 0;
            const updatedCategoryBudgets = state.CategoryBudgets.map(b => b.id === expense.category ? { ...b, value: (b.value || 0) - expenseAmount } : b);
            return { ...state, expenses: [...state.expenses, expense], CategoryBudgets: updatedCategoryBudgets, modal: false };
        }

        case "remove-expense": {
            const expenseToRemove = state.expenses.find(ex => ex.id === action.payload.id);
            if (!expenseToRemove) return state;
            const removedAmount = typeof expenseToRemove.amount === 'number' ? expenseToRemove.amount : 0;
            const updatedCategoryBudgets = state.CategoryBudgets.map(b => b.id === expenseToRemove.category ? { ...b, value: (b.value || 0) + removedAmount } : b);
            const updatedExpenses = state.expenses.filter(ex => ex.id !== action.payload.id);
            return { ...state, expenses: updatedExpenses, CategoryBudgets: updatedCategoryBudgets };
        }

        case "get-expense-by-id": return { ...state, editingId: action.payload.id, modal: true };

        case "update-expense": {
            const updatedExpenseData = action.payload.expense;
            const originalExpense = state.expenses.find(ex => ex.id === updatedExpenseData.id);
            if (!originalExpense) return state;

            const originalAmount = typeof originalExpense.amount === 'number' ? originalExpense.amount : 0;
            const updatedAmount = typeof updatedExpenseData.amount === 'number' ? updatedExpenseData.amount : 0;

            let finalDate: Date | null = null;
            if (updatedExpenseData.date instanceof Date && !isNaN(updatedExpenseData.date.getTime())) { finalDate = updatedExpenseData.date; }
            else if (typeof updatedExpenseData.date === 'string') {
                const parsed = new Date(updatedExpenseData.date);
                if (!isNaN(parsed.getTime())) { finalDate = parsed; }
            }
            if (finalDate === null && originalExpense.date instanceof Date && !isNaN(originalExpense.date.getTime())) { finalDate = originalExpense.date; }

            const updatedExpense = { ...updatedExpenseData, date: finalDate };

            let tempCategoryBudgets = state.CategoryBudgets.map(b => b.id === originalExpense.category ? { ...b, value: (b.value || 0) + originalAmount } : b);
            tempCategoryBudgets = tempCategoryBudgets.map(b => b.id === updatedExpense.category ? { ...b, value: (b.value || 0) - updatedAmount } : b);

            const updatedExpenses = state.expenses.map(ex => ex.id === updatedExpense.id ? updatedExpense : ex);

            return {
                ...state,
                expenses: updatedExpenses,
                CategoryBudgets: tempCategoryBudgets,
                modal: false,
                editingId: "",
            };
        }

        case "reset-app": return defaultState;
        case "add-filter-category": return { ...state, currentCategory: action.payload.id };
        default: return state;
    }
};