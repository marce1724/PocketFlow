// budget-reducer.ts

import { CategoryBudgets, Category, DraftExpense, Expense } from "../types";
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

// --- State Initialization --- (No changes)
const loadState = (): budgetState => {
    const localStorageState = localStorage.getItem("budgetState");
    if (localStorageState) {
        try {
            const parsedState = JSON.parse(localStorageState);
            if (
                parsedState.budget !== undefined &&
                Array.isArray(parsedState.CategoryBudgets) &&
                typeof parsedState.modal === 'boolean' &&
                Array.isArray(parsedState.expenses) &&
                typeof parsedState.editingId === 'string' &&
                typeof parsedState.currentCategory === 'string'
            ) {
                return parsedState as budgetState;
            } else {
                console.warn("Stored state structure is invalid or incomplete. Resetting to default.");
            }
        } catch (e) {
            console.error("Error parsing state from localStorage. Using default state.", e);
        }
    }
    return defaultState;
};
export const initialState: budgetState = loadState();

// --- Helper Functions --- (No changes)
const createExpense = (draftExpense: DraftExpense): Expense => {
    return {
        ...draftExpense,
        id: uuidv4(),
    };
};

// --- Reducer Function --- (No changes needed for decimal input)
export const budgetReducer = (
    state: budgetState = initialState,
    action: budgetActions
): budgetState => {
    switch (action.type) {
        case "add-budget": {
            const spentPerCategory = state.expenses.reduce((acc, expense) => {
                if (!acc[expense.category]) {
                    acc[expense.category] = 0;
                }
                // Ensure amounts are numbers before adding
                const expenseAmount = typeof expense.amount === 'number' ? expense.amount : 0;
                acc[expense.category] += expenseAmount;
                return acc;
            }, {} as Record<string, number>);

            const updatedCategoryBudgets = action.payload.CategoryBudgets.map(categoryBudget => {
                const spent = spentPerCategory[categoryBudget.id] || 0;
                // Ensure payload value is a number
                const allocatedValue = typeof categoryBudget.value === 'number' ? categoryBudget.value : 0;
                return {
                    ...categoryBudget,
                    value: allocatedValue - spent // Calculate remaining
                };
            });

            return {
                ...state,
                budget: action.payload.budget,
                CategoryBudgets: updatedCategoryBudgets,
            };
        }

        case "show-modal":
            return { ...state, modal: true };

        case "close-modal":
            // Reset editingId when modal closes
            return { ...state, modal: false, editingId: "" };

        case "add-expense": {
            const expense = createExpense(action.payload.expense);
             // Ensure amount is a number
            const expenseAmount = typeof expense.amount === 'number' ? expense.amount : 0;

            const updatedCategoryBudgets = state.CategoryBudgets.map((budget) => {
                if (budget.id === expense.category) {
                    const currentValue = typeof budget.value === 'number' ? budget.value : 0;
                    return { ...budget, value: currentValue - expenseAmount };
                }
                return budget;
            });
            return {
                ...state,
                expenses: [...state.expenses, expense],
                CategoryBudgets: updatedCategoryBudgets,
                modal: false, // Close modal after adding
            };
        }

        case "remove-expense": {
            const expenseToRemove = state.expenses.find((expense) => expense.id === action.payload.id);
            if (!expenseToRemove) return state;
             // Ensure amount is a number
            const removedAmount = typeof expenseToRemove.amount === 'number' ? expenseToRemove.amount : 0;

            const updatedCategoryBudgets = state.CategoryBudgets.map((budget) => {
                if (budget.id === expenseToRemove.category) {
                    const currentValue = typeof budget.value === 'number' ? budget.value : 0;
                    return { ...budget, value: currentValue + removedAmount };
                }
                return budget;
            });
            const updatedExpenses = state.expenses.filter((expense) => expense.id !== action.payload.id);

            return {
                ...state,
                expenses: updatedExpenses,
                CategoryBudgets: updatedCategoryBudgets,
            };
        }

        case "get-expense-by-id":
            // Set editingId and open modal
            return { ...state, editingId: action.payload.id, modal: true };

        case "update-expense": {
            const updatedExpense = action.payload.expense;
            const originalExpense = state.expenses.find((expense) => expense.id === updatedExpense.id);
            if (!originalExpense) return state;

             // Ensure amounts are numbers
            const originalAmount = typeof originalExpense.amount === 'number' ? originalExpense.amount : 0;
            const updatedAmount = typeof updatedExpense.amount === 'number' ? updatedExpense.amount : 0;


            let tempCategoryBudgets = [...state.CategoryBudgets];
            // Restore original amount
            tempCategoryBudgets = tempCategoryBudgets.map(budget => {
                if (budget.id === originalExpense.category) {
                    const currentValue = typeof budget.value === 'number' ? budget.value : 0;
                    return { ...budget, value: currentValue + originalAmount };
                }
                return budget;
            });
            // Deduct updated amount
            const finalCategoryBudgets = tempCategoryBudgets.map(budget => {
                if (budget.id === updatedExpense.category) {
                    const currentValue = typeof budget.value === 'number' ? budget.value : 0;
                    return { ...budget, value: currentValue - updatedAmount };
                }
                return budget;
            });

            const updatedExpenses = state.expenses.map((expense) =>
                expense.id === updatedExpense.id ? updatedExpense : expense
            );

            return {
                ...state,
                expenses: updatedExpenses,
                CategoryBudgets: finalCategoryBudgets,
                modal: false, // Close modal after update
                editingId: "", // Clear editing ID
            };
        }

        case "reset-app":
            // Return default state, useEffect in App handles localStorage clearing
            return defaultState;

        case "add-filter-category":
            return { ...state, currentCategory: action.payload.id };

        default:
            return state;
    }
};